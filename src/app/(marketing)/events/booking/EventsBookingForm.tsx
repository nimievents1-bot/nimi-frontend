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
 * Events booking form — submits a CONSULTATION-type enquiry.
 * Stored as kind=EVENTS with structured fields packed into `notes`.
 *
 * Once Cal.com is wired in, this form will become a thin wrapper over
 * the booking widget. Until then we capture preferred slots in free text
 * and the team books them externally.
 */
const Schema = z.object({
  name: z.string().min(2, "Please enter your name.").max(120),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(6).max(32),
  package: z.enum(["basic", "premium", "platinum", "tbd"]),
  preferred1Date: z.string().refine((v) => new Date(v).getTime() > Date.now(), {
    message: "First preferred date must be in the future.",
  }),
  preferred1Time: z.enum(["morning", "afternoon", "evening"]),
  preferred2Date: z
    .string()
    .optional()
    .refine((v) => !v || new Date(v).getTime() > Date.now(), {
      message: "Second preferred date must be in the future.",
    }),
  preferred2Time: z.enum(["morning", "afternoon", "evening"]).optional(),
  notes: z
    .string()
    .min(20, "Tell us a little about your event so we can prepare.")
    .max(4000),
  website: z.string().max(0).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof Schema>;

const TIME_LABEL: Record<"morning" | "afternoon" | "evening", string> = {
  morning: "Morning (9–12)",
  afternoon: "Afternoon (12–17)",
  evening: "Evening (17–19)",
};

export function EventsBookingForm() {
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

    const slotSummary = [
      `Preferred slot 1: ${values.preferred1Date} (${TIME_LABEL[values.preferred1Time]})`,
      values.preferred2Date && values.preferred2Time
        ? `Preferred slot 2: ${values.preferred2Date} (${TIME_LABEL[values.preferred2Time]})`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await apiFetch("/contact", {
        method: "POST",
        body: {
          kind: "EVENTS",
          name: values.name,
          email: values.email,
          phone: values.phone,
          eventType: `consultation:${values.package}`,
          eventDate: values.preferred1Date,
          notes: `${slotSummary}\n\n${values.notes}`,
          source: "events-booking",
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
        Thank you — your consultation request is in. We&rsquo;ll confirm a slot or propose the
        nearest alternative within one working day.
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

      <SelectField
        label="Package interest"
        required
        error={errors.package?.message}
        {...register("package")}
      >
        <option value="">Choose…</option>
        <option value="basic">Basic — coordination</option>
        <option value="premium">Premium — coordination + styling</option>
        <option value="platinum">Platinum — full planning</option>
        <option value="tbd">Not sure yet</option>
      </SelectField>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <TextField
          label="Preferred date 1"
          type="date"
          required
          error={errors.preferred1Date?.message}
          {...register("preferred1Date")}
        />
        <SelectField
          label="Time of day"
          required
          error={errors.preferred1Time?.message}
          {...register("preferred1Time")}
        >
          <option value="">Choose…</option>
          <option value="morning">Morning (9–12)</option>
          <option value="afternoon">Afternoon (12–17)</option>
          <option value="evening">Evening (17–19)</option>
        </SelectField>
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <TextField
          label="Preferred date 2 (optional)"
          type="date"
          error={errors.preferred2Date?.message}
          {...register("preferred2Date")}
        />
        <SelectField label="Time of day" error={errors.preferred2Time?.message} {...register("preferred2Time")}>
          <option value="">—</option>
          <option value="morning">Morning (9–12)</option>
          <option value="afternoon">Afternoon (12–17)</option>
          <option value="evening">Evening (17–19)</option>
        </SelectField>
      </div>

      <TextareaField
        label="Tell us about your event"
        rows={5}
        required
        hint="Date, vibe, guest count, anything that helps us prepare for the call."
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
        {isSubmitting ? "Sending…" : "Book consultation"}
      </Button>
      <p className="mt-3 font-sans text-xs text-neutral-500">
        We confirm consultation slots within one working day.
      </p>
    </form>
  );
}
