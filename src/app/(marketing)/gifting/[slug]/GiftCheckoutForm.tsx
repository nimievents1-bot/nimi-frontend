"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import {
  TextField,
  TextareaField,
} from "@/components/primitives/Field";
import { Turnstile } from "@/components/primitives/Turnstile";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Hard client-side ceiling on the upload. The server enforces its
 * own 10 MB cap independently — this duplicate is a friendlier
 * pre-flight so the customer sees an instant error instead of
 * sending 50 MB across their mobile connection only to be rejected.
 */
const LOGO_MAX_BYTES = 10 * 1024 * 1024;
/** Accept-list mirrored to the server for the same UX-vs-truth reason. */
const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/svg+xml,application/pdf";

interface Props {
  slug: string;
  name: string;
  moq: number;
  unitPriceMinor: number;
  currency: string;
}

/**
 * Gifting checkout form — captures recipient + customisation, posts to the
 * API which creates a Stripe Checkout Session and returns the URL. We then
 * `window.location.assign(url)` to redirect the customer to Stripe-hosted
 * card collection.
 */
export function GiftCheckoutForm({ slug, name, moq, unitPriceMinor, currency }: Props) {
  const [token, setToken] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Logo upload state. Kept outside react-hook-form because the
  // file isn't a form value — the upload runs ahead of submit and
  // only the resulting public URL is sent with the checkout
  // request. Storing the URL (not the file) lets the customer
  // change their mind about the rest of the form without re-
  // uploading every time.
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const onLogoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    // Reset the input value immediately so picking the same file
    // again after an error re-fires the change event.
    e.target.value = "";
    if (!file) return;

    if (file.size > LOGO_MAX_BYTES) {
      setLogoError(`That file is too large — maximum is ${LOGO_MAX_BYTES / 1024 / 1024} MB.`);
      return;
    }

    setLogoUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload/gift-logo", {
        method: "POST",
        body,
      });
      // Parse JSON defensively — Vercel can return HTML error pages
      // (e.g. 413 from the platform itself) which would crash a
      // naive res.json() call.
      const text = await res.text();
      let payload: { url?: string; error?: string } = {};
      try {
        payload = text ? (JSON.parse(text) as typeof payload) : {};
      } catch {
        payload = {};
      }
      if (!res.ok || !payload.url) {
        setLogoError(payload.error ?? "Upload failed. Please try again.");
        return;
      }
      setLogoUrl(payload.url);
    } catch {
      setLogoError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
    setLogoError(null);
  };

  const Schema = z.object({
    quantity: z
      .preprocess((v) => Number(v), z.number().int("Whole numbers only.").min(moq, `Minimum is ${moq}.`).max(2_000)),
    name: z.string().min(2, "Please enter your name.").max(120),
    email: z.string().email("Please enter a valid email."),
    notes: z.string().max(2000).optional().or(z.literal("")),
    custName: z.string().max(80).optional().or(z.literal("")),
    custMessage: z.string().max(500).optional().or(z.literal("")),
    custColourTheme: z.string().max(40).optional().or(z.literal("")),
    // PRD §7.4.3 — customer must explicitly accept that designs need
    // approval before production starts. The API enforces this too.
    designApprovalAccepted: z.boolean().refine((v) => v === true, {
      message:
        "Please confirm that you understand designs need to be approved before production begins.",
    }),
    website: z.string().max(0).optional().or(z.literal("")),
  });
  type FormValues = z.infer<typeof Schema>;

  const fmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { quantity: moq },
  });

  const qty = Number(watch("quantity") ?? moq);
  const totalLabel = !Number.isNaN(qty) ? fmt.format((unitPriceMinor * qty) / 100) : "—";

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    if (!token) {
      setServerError("Please complete the bot-protection challenge.");
      return;
    }
    setPending(true);
    try {
      const result = await apiFetch<{ url: string }>("/gifting/checkout/session", {
        method: "POST",
        body: {
          collectionSlug: slug,
          quantity: values.quantity,
          name: values.name,
          email: values.email,
          notes: values.notes || undefined,
          customisation: {
            ...(values.custName ? { names: values.custName } : {}),
            ...(values.custMessage ? { message: values.custMessage } : {}),
            ...(values.custColourTheme ? { colourTheme: values.custColourTheme } : {}),
            // logoUrl is set only when the customer successfully
            // completed the upload step. We never let a half-baked
            // upload leak into the order — empty string would be a
            // worse signal than absent.
            ...(logoUrl ? { logoUrl } : {}),
          },
          designApprovalAccepted: values.designApprovalAccepted,
          turnstileToken: token,
        },
      });
      // Hand off to Stripe-hosted Checkout.
      window.location.assign(result.url);
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.detail : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  });

  return (
    <form noValidate onSubmit={submit} className="border border-cream-200 bg-paper p-6">
      <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">Order {name}</h2>

      {serverError ? (
        <Alert variant="danger" className="mb-4">
          {serverError}
        </Alert>
      ) : null}

      <TextField
        label="Quantity"
        type="number"
        required
        hint={`Minimum order quantity is ${moq}.`}
        min={moq}
        error={errors.quantity?.message as string | undefined}
        {...register("quantity")}
      />

      <p className="mb-6 font-sans text-base text-neutral-700">
        <span className="font-display text-2xl font-semibold text-maroon-600">{totalLabel}</span>
        <span className="ml-2 text-sm text-neutral-500">total · paid securely via Stripe</span>
      </p>

      <h3 className="mb-3 mt-6 font-display text-lg font-medium text-maroon-600">Your details</h3>
      <TextField label="Full name" required error={errors.name?.message} {...register("name")} />
      <TextField label="Email" type="email" required error={errors.email?.message} {...register("email")} />

      <h3 className="mb-3 mt-6 font-display text-lg font-medium text-maroon-600">
        Customisation (optional)
      </h3>
      <TextField
        label="Names / event"
        hint="Names or event title to personalise on the box."
        error={errors.custName?.message}
        {...register("custName")}
      />
      <TextField
        label="Colour theme"
        hint="A brand colour, a wedding palette, or just a vibe."
        error={errors.custColourTheme?.message}
        {...register("custColourTheme")}
      />

      {/*
        Logo upload — optional. Lives outside react-hook-form because
        the value we care about is the public URL returned by the
        server, not the File object itself. The hidden <input
        type="file"> is driven by an explicit Button so we control the
        label, the disabled state during an in-flight upload, and the
        focus-visible ring on the visible affordance.
      */}
      <div className="mb-4">
        <p className="mb-1 font-sans text-sm font-medium text-neutral-900">
          Logo (optional)
        </p>
        <p className="mb-2 font-sans text-xs text-neutral-500">
          PNG, JPG, WebP, AVIF, SVG or PDF — up to 10 MB.
        </p>
        {logoUrl ? (
          <div className="flex items-center gap-3 border border-cream-200 bg-cream-50 px-3 py-2">
            {/*
              Render a preview only when the URL points at an
              inline-safe raster — the server re-encodes raster
              uploads to .webp, so checking the extension is
              reliable. SVG / PDF can't be rendered inline by
              <img> safely from a customer-supplied origin, so
              we show a generic "uploaded" badge instead.
            */}
            {/\.webp(\?|$)/i.test(logoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Your uploaded logo"
                className="h-12 w-12 border border-cream-200 bg-paper object-contain"
              />
            ) : (
              <div
                aria-hidden
                className="grid h-12 w-12 place-items-center border border-cream-200 bg-paper font-sans text-xs text-neutral-500"
              >
                File
              </div>
            )}
            <div className="min-w-0 flex-1 font-sans text-sm text-neutral-700">
              <p className="m-0 truncate">Uploaded. We'll use this on your designs.</p>
              <p className="m-0 text-xs text-neutral-500">
                Need to swap it? Remove and re-upload.
              </p>
            </div>
            <button
              type="button"
              onClick={removeLogo}
              className="font-sans text-xs text-maroon-600 underline hover:no-underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={logoInputRef}
              type="file"
              accept={LOGO_ACCEPT}
              className="hidden"
              onChange={(e) => {
                void onLogoSelected(e);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={logoUploading}
              onClick={() => logoInputRef.current?.click()}
            >
              {logoUploading ? "Uploading…" : "Upload logo"}
            </Button>
            <span className="font-sans text-xs text-neutral-500">
              We'll only use this on your gift designs.
            </span>
          </div>
        )}
        {logoError ? (
          <p
            role="alert"
            className="mt-2 font-sans text-xs text-semantic-danger"
          >
            {logoError}
          </p>
        ) : null}
      </div>

      <TextareaField
        label="Personal message"
        rows={3}
        hint="A short note, max 500 chars."
        error={errors.custMessage?.message}
        {...register("custMessage")}
      />

      <TextareaField
        label="Anything else?"
        rows={3}
        hint="Special requests, packaging notes, target delivery date."
        error={errors.notes?.message as string | undefined}
        {...register("notes")}
      />

      {/* Honeypot */}
      <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label>
          Website (do not fill)
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      {/*
        PRD-required acknowledgement. The API rejects the checkout
        request if this isn't ticked, so we want the customer to see
        the box (and the error if they miss it) before they hand over
        card details. Styled like the rest of our form controls —
        cream tile, maroon accent, brand sans copy.
      */}
      <label className="mt-2 flex items-start gap-3 border border-cream-200 bg-cream-50 px-4 py-3 font-sans text-sm text-neutral-800">
        <input
          type="checkbox"
          {...register("designApprovalAccepted")}
          className="mt-0.5 h-4 w-4 flex-none accent-maroon-600"
        />
        <span>
          I understand each gift box is made to order and that the final design{" "}
          <strong>requires my approval</strong> before production begins. The team will email
          a mock-up within a few working days; production starts only after I approve it.
        </span>
      </label>
      {errors.designApprovalAccepted ? (
        <p role="alert" className="mt-1 font-sans text-xs text-semantic-danger">
          {errors.designApprovalAccepted.message}
        </p>
      ) : null}

      <Turnstile onToken={setToken} />

      <Button type="submit" block disabled={isSubmitting || pending}>
        {pending ? "Redirecting…" : "Pay & order"}
      </Button>
      <p className="mt-3 font-sans text-xs text-neutral-500">
        You'll be taken to Stripe to enter card details. After payment we begin the design phase
        and email you a mock-up for approval before production starts.
      </p>
    </form>
  );
}
