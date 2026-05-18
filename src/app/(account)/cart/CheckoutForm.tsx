"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { TextField, TextareaField } from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

interface CheckoutDefaults {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

interface CheckoutFormProps {
  meetsMinimum: boolean;
  anyUnavailable: boolean;
  /**
   * Initial values pulled from the customer's saved profile so they
   * don't have to retype their delivery address every checkout. They
   * can still edit any field before placing the order — this is just
   * a "make the common case nicer" affordance.
   */
  defaults?: CheckoutDefaults;
}

/**
 * CheckoutForm — collects the delivery address + recipient name, then
 * POSTs to `/pastry-orders/checkout`. The API decides whether a Stripe
 * redirect is needed (cart payable > 0) or whether to mark the order
 * PAID immediately (credits cover the whole bill).
 *
 * The `meetsMinimum` and `anyUnavailable` flags come from the cart view
 * already computed server-side; we mirror them in the disabled state so
 * the user sees the gate before clicking, not after.
 */
export function CheckoutForm({ meetsMinimum, anyUnavailable, defaults }: CheckoutFormProps) {
  const router = useRouter();

  // Pre-fill from the customer's saved profile when present, so a
  // returning customer doesn't retype their delivery address every
  // time. Every field stays editable — these are just the starting
  // values. New customers without a profile address see empty inputs.
  const [recipientName, setRecipientName] = useState(defaults?.name ?? "");
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [shippingLine1, setShippingLine1] = useState(defaults?.line1 ?? "");
  const [shippingLine2, setShippingLine2] = useState(defaults?.line2 ?? "");
  const [shippingCity, setShippingCity] = useState(defaults?.city ?? "");
  const [shippingPostcode, setShippingPostcode] = useState(defaults?.postcode ?? "");
  // Country is locked to GB for v1 (delivery is UK-only). When the
  // operator opens up multi-country shipping, expose a select field
  // here and replace this constant with state.
  const shippingCountry = defaults?.country ?? "GB";
  const [notes, setNotes] = useState("");

  // Promo code (birthday treat, welcome, etc.). The "Apply" affordance
  // hits the read-only preview endpoint so the customer sees the
  // discount land before checkout; the redemption itself happens
  // atomically on `Place order`. We keep both the typed value and the
  // last accepted preview so the UI can keep showing the discount
  // even if the user edits the field afterwards (we'll revalidate on
  // submit anyway).
  const [promoCode, setPromoCode] = useState("");
  const [promoPreview, setPromoPreview] = useState<{
    code: string;
    discountMinor: number;
    currency: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoPending, setPromoPending] = useState(false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Separate state for the field-level validation list so we can render
  // each issue as its own bullet inside the brand Alert rather than as
  // one semicolon-joined wall of text.
  const [issues, setIssues] = useState<string[] | null>(null);

  /** Apply / re-validate the promo code against the cart. Read-only. */
  const onApplyPromo = async () => {
    setPromoError(null);
    setPromoPreview(null);
    const code = promoCode.trim();
    if (!code) {
      setPromoError("Enter a promo code to apply.");
      return;
    }
    setPromoPending(true);
    try {
      const result = await apiFetch<{
        code: string;
        discountMinor: number;
        currency: string;
      }>("/pastry-orders/promo/preview", {
        method: "POST",
        body: { code },
      });
      setPromoPreview(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setPromoError(err.detail);
      } else {
        setPromoError("Couldn't check that code right now — please try again.");
      }
    } finally {
      setPromoPending(false);
    }
  };

  const onRemovePromo = () => {
    setPromoCode("");
    setPromoPreview(null);
    setPromoError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIssues(null);
    setPending(true);
    try {
      const result = await apiFetch<{ url: string; reference: string }>(
        "/pastry-orders/checkout",
        {
          method: "POST",
          body: {
            recipientName: recipientName.trim(),
            phone: phone.trim() || undefined,
            shippingLine1: shippingLine1.trim(),
            shippingLine2: shippingLine2.trim() || undefined,
            shippingCity: shippingCity.trim(),
            shippingPostcode: shippingPostcode.trim().toUpperCase(),
            shippingCountry: shippingCountry.trim().toUpperCase() || "GB",
            notes: notes.trim() || undefined,
            // Pass the preview's accepted code if the customer locked
            // one in, otherwise fall back to whatever they typed (the
            // API will revalidate either way; this keeps the flow
            // forgiving if they typed but forgot to hit Apply).
            promoCode: (promoPreview?.code ?? promoCode).trim() || undefined,
          },
        },
      );

      // External Stripe URL → assign location. Same-origin success URL →
      // router.push so RSC/cache invalidation kicks in.
      if (/^https?:\/\//.test(result.url) && !result.url.startsWith(window.location.origin)) {
        window.location.assign(result.url);
      } else {
        router.push(result.url);
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // A 400 from class-validator carries the field issues as an
        // array in `fieldErrors.errors`. Render those as bullets and
        // skip the joined `detail` (it's literally the bullets glued
        // together with "; " — redundant when we have the list).
        const validationList = err.fieldErrors?.errors ?? null;
        if (validationList && validationList.length > 0) {
          setIssues(validationList);
          setError(null);
        } else {
          setError(err.detail);
          setIssues(null);
        }
      } else {
        setError("Couldn't start checkout.");
        setIssues(null);
      }
      setPending(false);
    }
  };

  const disabled = pending || !meetsMinimum || anyUnavailable;

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-1">
      {/* Validation issues — rendered as a bulleted list inside the
          brand Alert so each problem is scannable on its own line.
          Title is friendly ("Please check the highlighted fields")
          and the field labels live inside each bullet, not at the
          start of a wall of text. */}
      {issues ? (
        <Alert variant="danger" className="mb-4">
          <p className="m-0 mb-2 font-semibold">Please check these details before continuing:</p>
          <ul className="m-0 list-disc pl-5 font-sans text-sm">
            {issues.map((issue, idx) => (
              <li key={idx} className="mt-1 first:mt-0">
                {issue}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {/* General error (network failure, 5xx, etc.) — single message. */}
      {error ? (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <TextField
        label="Full name"
        autoComplete="name"
        required
        minLength={2}
        maxLength={120}
        value={recipientName}
        onChange={(e) => setRecipientName(e.target.value)}
      />
      <TextField
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        maxLength={32}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <TextField
        label="Address line 1"
        autoComplete="address-line1"
        required
        maxLength={200}
        value={shippingLine1}
        onChange={(e) => setShippingLine1(e.target.value)}
      />
      <TextField
        label="Address line 2 (optional)"
        autoComplete="address-line2"
        maxLength={200}
        value={shippingLine2}
        onChange={(e) => setShippingLine2(e.target.value)}
      />
      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <TextField
          label="City"
          autoComplete="address-level2"
          required
          maxLength={80}
          value={shippingCity}
          onChange={(e) => setShippingCity(e.target.value)}
        />
        <TextField
          label="Postcode"
          autoComplete="postal-code"
          required
          minLength={3}
          maxLength={10}
          value={shippingPostcode}
          onChange={(e) => setShippingPostcode(e.target.value)}
        />
      </div>

      <TextareaField
        label="Notes for the kitchen (optional)"
        rows={3}
        hint="Allergies, gate codes, drop-off instructions."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {/*
        Promo code (birthday treat, welcome code, etc.). Optional —
        ignored entirely if blank. We show the preview state inline so
        the customer knows the discount has landed before they hit
        "Place order". Pressing Enter inside the input triggers
        Apply rather than submitting the parent form (handled via
        keyDown so Form's default submit semantics aren't shadowed).
      */}
      <div className="mt-4 border border-cream-200 bg-paper p-4">
        <p className="m-0 mb-1 font-display text-base font-medium text-maroon-600">
          Promo code (optional)
        </p>
        <p className="mb-3 font-sans text-xs text-neutral-500">
          Have a birthday treat or other code? Enter it here.
        </p>
        {promoPreview ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm tracking-[0.16em] text-maroon-700">
              {promoPreview.code}
            </span>
            <span className="font-display text-sm italic text-orange-700">
              −{" "}
              {new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: promoPreview.currency.toUpperCase(),
              }).format(promoPreview.discountMinor / 100)}
            </span>
            <button
              type="button"
              onClick={onRemovePromo}
              className="ml-auto font-sans text-xs uppercase tracking-[0.16em] text-neutral-500 underline underline-offset-4 hover:text-maroon-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-stretch gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void onApplyPromo();
                }
              }}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={64}
              placeholder="e.g. BDAY-JANE-7Q2X9"
              aria-label="Promo code"
              className="flex-1 border border-cream-200 bg-cream-50 px-3 py-2 font-mono text-sm uppercase tracking-[0.12em] focus:border-orange-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={onApplyPromo}
              disabled={promoPending}
              className="border border-maroon-600 bg-maroon-600 px-4 py-2 font-display italic text-cream-50 transition hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {promoPending ? "Checking…" : "Apply"}
            </button>
          </div>
        )}
        {promoError ? (
          <p
            role="alert"
            className="mt-2 font-sans text-xs text-semantic-danger"
          >
            {promoError}
          </p>
        ) : null}
      </div>

      <div className="pt-3">
        <Button type="submit" variant="primary" block disabled={disabled}>
          {pending ? "Redirecting…" : "Place order"}
        </Button>
        {!meetsMinimum ? (
          <p className="mt-3 text-center font-sans text-xs text-neutral-500">
            Add a few more items to reach the £25 minimum before checkout.
          </p>
        ) : anyUnavailable ? (
          <p className="mt-3 text-center font-sans text-xs text-semantic-danger">
            Remove unavailable items before checking out.
          </p>
        ) : (
          <p className="mt-3 text-center font-sans text-xs text-neutral-500">
            Indulgence Credits apply automatically. Stripe handles the balance.
          </p>
        )}
      </div>
    </form>
  );
}
