"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import {
  SelectField,
  TextField,
  TextareaField,
} from "@/components/primitives/Field";
import { Turnstile } from "@/components/primitives/Turnstile";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Catering enquiry form — POSTs to the same /contact endpoint as the
 * generic form, but with `kind: "CATERING"` and richer fields populated.
 *
 * Date validation is enforced both on the client (must be in the future)
 * and on the API (`@MinDate(new Date())` in the DTO).
 */
const Schema = z.object({
  name: z.string().min(2, "Please enter your name.").max(120),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(6, "Please enter a contactable phone number.").max(32),
  eventDate: z
    .string()
    .min(1, "Please pick an event date.")
    .refine((v) => new Date(v).getTime() > Date.now(), {
      message: "Event date must be in the future.",
    }),
  eventType: z.enum(["wedding", "corporate", "birthday", "private", "other"], {
    errorMap: () => ({ message: "Please choose an event type." }),
  }),
  guestCount: z
    .preprocess(
      (v) => (typeof v === "string" && v.length === 0 ? undefined : Number(v)),
      z.number().int("Whole numbers only.").positive().max(10_000),
    )
    .optional(),
  budgetBand: z.enum(["<1k", "1-5k", "5-15k", "15k+", "tbd"]).optional(),
  dietary: z.string().max(500).optional().or(z.literal("")),
  notes: z
    .string()
    .min(20, "Tell us a little more so we can plan.")
    .max(4000, "Please keep it under 4,000 characters."),
  website: z.string().max(0).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof Schema>;

export function CateringBookingForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [token, setToken] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(Schema) });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    if (!token) {
      setServerError("Please complete the bot-protection challenge before sending.");
      return;
    }
    try {
      await apiFetch("/contact", {
        method: "POST",
        body: {
          kind: "CATERING",
          name: values.name,
          email: values.email,
          phone: values.phone,
          eventDate: values.eventDate,
          eventType: values.eventType,
          ...(values.guestCount !== undefined ? { guestCount: values.guestCount } : {}),
          ...(values.budgetBand ? { budgetBand: values.budgetBand } : {}),
          ...(values.dietary ? { dietary: values.dietary } : {}),
          notes: values.notes,
          source: "catering-booking",
          turnstileToken: token,
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
        Thank you — your enquiry is on its way. We&rsquo;ll reply within one working day. Look out
        for an acknowledgement email; check your spam folder if you don&rsquo;t see it within a few
        minutes.
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
        label="Phone"
        type="tel"
        autoComplete="tel"
        required
        error={errors.phone?.message}
        {...register("phone")}
      />

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <TextField
          label="Event date"
          type="date"
          required
          error={errors.eventDate?.message}
          {...register("eventDate")}
        />
        <SelectField
          label="Event type"
          required
          error={errors.eventType?.message}
          {...register("eventType")}
        >
          <option value="">Choose…</option>
          <option value="wedding">Wedding</option>
          <option value="corporate">Corporate</option>
          <option value="birthday">Birthday</option>
          <option value="private">Private dinner</option>
          <option value="other">Other</option>
        </SelectField>
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <TextField
          label="Guest count (approx.)"
          type="number"
          min={1}
          error={errors.guestCount?.message}
          {...register("guestCount")}
        />
        <SelectField label="Budget band" error={errors.budgetBand?.message} {...register("budgetBand")}>
          <option value="">Prefer not to say</option>
          <option value="<1k">Under £1,000</option>
          <option value="1-5k">£1,000 – £5,000</option>
          <option value="5-15k">£5,000 – £15,000</option>
          <option value="15k+">£15,000+</option>
          <option value="tbd">To be discussed</option>
        </SelectField>
      </div>

      <TextareaField
        label="Dietary requirements or allergies"
        rows={3}
        hint="If you'd rather discuss on the call, leave blank."
        error={errors.dietary?.message}
        {...register("dietary")}
      />

      <TextareaField
        label="Tell us about your event"
        rows={6}
        required
        hint="Vibe, must-have dishes, venue, additional services (bar / staff / coordination)."
        error={errors.notes?.message}
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

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Submit Enquiry"}
      </Button>
      <p className="mt-3 font-sans text-xs text-neutral-500">
        We reply within one working day.
      </p>
    </form>
  );
}
