"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { TextField, TextareaField } from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

interface CheckoutFormProps {
  meetsMinimum: boolean;
  anyUnavailable: boolean;
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
export function CheckoutForm({ meetsMinimum, anyUnavailable }: CheckoutFormProps) {
  const router = useRouter();

  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingLine2, setShippingLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostcode, setShippingPostcode] = useState("");
  // Country is locked to GB for v1 (delivery is UK-only). When the
  // operator opens up multi-country shipping, expose a select field
  // here and replace this constant with state.
  const shippingCountry = "GB";
  const [notes, setNotes] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      setError(err instanceof ApiError ? err.detail : "Couldn't start checkout.");
      setPending(false);
    }
  };

  const disabled = pending || !meetsMinimum || anyUnavailable;

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-1">
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
