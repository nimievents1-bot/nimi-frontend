"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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

  const Schema = z.object({
    quantity: z
      .preprocess((v) => Number(v), z.number().int("Whole numbers only.").min(moq, `Minimum is ${moq}.`).max(2_000)),
    name: z.string().min(2, "Please enter your name.").max(120),
    email: z.string().email("Please enter a valid email."),
    notes: z.string().max(2000).optional().or(z.literal("")),
    custName: z.string().max(80).optional().or(z.literal("")),
    custMessage: z.string().max(500).optional().or(z.literal("")),
    custColourTheme: z.string().max(40).optional().or(z.literal("")),
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
          },
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
