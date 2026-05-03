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
 * Behaviour notes:
 *   - When a user lands from a tier card on `/events`, the page narrows the
 *     `?tier=` param to a known slug and forwards it as `initialTier`. The
 *     dropdown is replaced with a confirmation row + a "change" button so
 *     they're never asked to pick the same package twice.
 *   - Time-of-day uses concrete hour slots (09:00–17:00) — replacing the
 *     earlier morning/afternoon/evening bands which were too coarse to be
 *     useful when scheduling.
 *
 * When Cal.com is wired in (Track 4) this form will be replaced with the
 * embedded widget for paid consultations. For now the form captures preferred
 * slots in free text and the team books them externally.
 */

/** Public type so the page can narrow `searchParams.tier` to a known slug. */
export type EventsTierSlug = "coordination" | "design" | "production";

/** Hourly slots offered to the user. 24-hour strings keep storage tidy. */
const HOUR_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
] as const;

type HourSlot = (typeof HOUR_SLOTS)[number];

const Schema = z.object({
  name: z.string().min(2, "Please enter your name.").max(120),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(6).max(32),
  package: z.enum(["coordination", "design", "production", "tbd"]),
  preferred1Date: z.string().refine((v) => new Date(v).getTime() > Date.now(), {
    message: "First preferred date must be in the future.",
  }),
  preferred1Time: z.enum(HOUR_SLOTS, {
    errorMap: () => ({ message: "Please pick a time slot." }),
  }),
  preferred2Date: z
    .string()
    .optional()
    .refine((v) => !v || new Date(v).getTime() > Date.now(), {
      message: "Second preferred date must be in the future.",
    }),
  preferred2Time: z
    .enum(HOUR_SLOTS)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .min(20, "Tell us a little about your event so we can prepare.")
    .max(4000),
  website: z.string().max(0).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof Schema>;

const PACKAGE_LABEL: Record<EventsTierSlug | "tbd", string> = {
  coordination: "Tier 1 — Event Coordination",
  design: "Tier 2 — Event Design & Coordination",
  production: "Tier 3 — Full Event Production",
  tbd: "Not yet decided",
};

/** UI label for a time slot — displays as "9:00 AM" / "1:00 PM". */
function formatHourLabel(hh: HourSlot): string {
  const [hStr] = hh.split(":");
  const h = Number(hStr);
  const meridiem = h < 12 ? "AM" : "PM";
  const display = h === 12 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${meridiem}`;
}

interface EventsBookingFormProps {
  /**
   * Tier pre-selected by `?tier=...` on the booking URL. When present, the
   * package dropdown is hidden and the user sees a read-only confirmation
   * row with a "Change" button.
   */
  initialTier?: EventsTierSlug;
}

export function EventsBookingForm({ initialTier }: EventsBookingFormProps = {}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [token, setToken] = useState("");
  const [tierLocked, setTierLocked] = useState<boolean>(Boolean(initialTier));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: initialTier ? { package: initialTier } : undefined,
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    if (!token) {
      setServerError("Please complete the bot-protection challenge before sending.");
      return;
    }

    const slotSummary = [
      `Preferred slot 1: ${values.preferred1Date} at ${formatHourLabel(
        values.preferred1Time as HourSlot,
      )}`,
      values.preferred2Date && values.preferred2Time
        ? `Preferred slot 2: ${values.preferred2Date} at ${formatHourLabel(
            values.preferred2Time as HourSlot,
          )}`
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
          source: `events-booking:${values.package}`,
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

      {tierLocked && initialTier ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-cream-200 bg-cream-100 px-4 py-3">
          <div>
            <p className="m-0 font-sans text-xs uppercase tracking-[0.2em] text-maroon-700">
              Package interest
            </p>
            <p className="m-0 font-display text-lg font-medium text-maroon-700">
              {PACKAGE_LABEL[initialTier]}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setTierLocked(false)}
          >
            Change
          </Button>
          {/* Hidden input mirrors the locked tier so the form submits correctly. */}
          <input type="hidden" value={initialTier} {...register("package")} />
        </div>
      ) : (
        <SelectField
          label="Package interest"
          required
          error={errors.package?.message}
          {...register("package")}
        >
          <option value="">Choose…</option>
          <option value="coordination">Tier 1 — Event Coordination</option>
          <option value="design">Tier 2 — Event Design & Coordination</option>
          <option value="production">Tier 3 — Full Event Production</option>
          <option value="tbd">Not sure yet</option>
        </SelectField>
      )}

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <TextField
          label="Preferred date 1"
          type="date"
          required
          error={errors.preferred1Date?.message}
          {...register("preferred1Date")}
        />
        <SelectField
          label="Preferred time"
          required
          error={errors.preferred1Time?.message}
          {...register("preferred1Time")}
        >
          <option value="">Choose a time…</option>
          {HOUR_SLOTS.map((s) => (
            <option key={s} value={s}>
              {formatHourLabel(s)}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <TextField
          label="Preferred date 2 (optional)"
          type="date"
          error={errors.preferred2Date?.message}
          {...register("preferred2Date")}
        />
        <SelectField
          label="Preferred time (optional)"
          error={errors.preferred2Time?.message}
          {...register("preferred2Time")}
        >
          <option value="">—</option>
          {HOUR_SLOTS.map((s) => (
            <option key={s} value={s}>
              {formatHourLabel(s)}
            </option>
          ))}
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

      {/* Honeypot — invisible to humans, never reachable by tab. */}
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
