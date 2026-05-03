"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { SelectField, TextField, TextareaField } from "@/components/primitives/Field";
import { Turnstile } from "@/components/primitives/Turnstile";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Contact form mirrors the API's CreateContactEnquiryDto.
 * The honeypot `website` field is invisible; bots fill it, real users don't.
 *
 * Server-side: same Zod-equivalent rules are enforced again, plus Turnstile
 * verification, plus rate limiting via @Throttle("contact").
 */
const Schema = z.object({
  kind: z.enum(["GENERAL", "CATERING", "EVENTS", "GIFTING", "CRAVINGS", "PRESS"]),
  name: z.string().min(2, "Please enter your name.").max(120),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().max(32).optional().or(z.literal("")),
  notes: z
    .string()
    .min(10, "Tell us a little more so we can help.")
    .max(4000, "That's a lot — please keep it under 4,000 characters."),
  // Honeypot — must be empty.
  website: z.string().max(0).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof Schema>;

export function ContactForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { kind: "GENERAL" },
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    if (!turnstileToken) {
      setServerError("Please complete the bot-protection challenge before sending.");
      return;
    }

    try {
      await apiFetch("/contact", {
        method: "POST",
        body: {
          ...values,
          phone: values.phone || undefined,
          turnstileToken,
          source: "contact",
        },
      });
      setDone(true);
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.detail : "Something went wrong. Please try again.",
      );
    }
  });

  if (done) {
    return (
      <Alert variant="success">
        Thank you — your message is on its way. We&rsquo;ll reply within one working day.
      </Alert>
    );
  }

  return (
    <form noValidate onSubmit={submit}>
      {serverError ? (
        <Alert variant="danger" className="mb-4">
          {serverError}
        </Alert>
      ) : null}

      <SelectField label="What's it about?" required error={errors.kind?.message} {...register("kind")}>
        <option value="GENERAL">General enquiry</option>
        <option value="CATERING">Catering</option>
        <option value="EVENTS">Event planning / coordination</option>
        <option value="GIFTING">Gifting</option>
        <option value="CRAVINGS">The Indulgence Club</option>
        <option value="PRESS">Press</option>
      </SelectField>

      <TextField label="Full name" autoComplete="name" required error={errors.name?.message} {...register("name")} />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />

      <TextareaField
        label="Tell us about your event or what you need"
        rows={6}
        required
        hint="Date, location, guest count, vibe, must-have dishes, dietary needs — anything helpful."
        error={errors.notes?.message}
        {...register("notes")}
      />

      {/* Honeypot — visually hidden, but reachable to bots that fill all fields. */}
      <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label>
          Website (do not fill)
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <Turnstile onToken={setTurnstileToken} />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Submit Enquiry"}
      </Button>
      <p className="mt-3 font-sans text-xs text-neutral-500">
        We reply within one working day.
      </p>
    </form>
  );
}
