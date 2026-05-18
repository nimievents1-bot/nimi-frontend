"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { ApiError, apiFetch } from "@/lib/api";

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  addressCountry: string | null;
  birthDay: number | null;
  birthMonth: number | null;
  emailVerifiedAt: string | null;
  role: string;
  createdAt: string;
}

/** Display labels for the birthday-month <select> — matches the signup form. */
const MONTHS: Array<{ value: number; label: string }> = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

/**
 * ProfileForm — single editable form for the customer-editable parts
 * of their account record. Email is shown read-only (changing email
 * requires a verification flow that lives elsewhere in /account/security).
 *
 * The address block is the operationally-important piece: once filled in,
 * the admin sees where to send Indulgence Club deliveries from
 * `/admin/cravings`, and the pastry checkout form pre-fills these
 * fields so a returning customer doesn't retype them.
 */
export function ProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();

  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [line1, setLine1] = useState(initial.addressLine1 ?? "");
  const [line2, setLine2] = useState(initial.addressLine2 ?? "");
  const [city, setCity] = useState(initial.addressCity ?? "");
  const [postcode, setPostcode] = useState(initial.addressPostcode ?? "");
  const [country, setCountry] = useState(initial.addressCountry ?? "GB");
  // Birthday is intentionally stored as strings in form state so an
  // empty select is distinguishable from "0". We coerce to number /
  // null only when serialising the PATCH body.
  const [birthDay, setBirthDay] = useState(
    initial.birthDay != null ? String(initial.birthDay) : "",
  );
  const [birthMonth, setBirthMonth] = useState(
    initial.birthMonth != null ? String(initial.birthMonth) : "",
  );

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[] | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIssues(null);

    // Client-side birthday consistency check — both fields must be set
    // or both empty. The API enforces this server-side too, but the
    // client check gives a snappier response than waiting for a 400.
    const dayPresent = birthDay !== "";
    const monthPresent = birthMonth !== "";
    if (dayPresent !== monthPresent) {
      setError(
        "Please pick both the day and the month of your birthday — or clear both to remove it.",
      );
      return;
    }

    setPending(true);
    try {
      // Serialise birthday as either { day, month } numbers, both null
      // (explicit clear), or omitted entirely (no change). Omitting is
      // the default when neither field has changed from the initial
      // value, so we don't accidentally clear a saved birthday by
      // submitting the form to update an unrelated field.
      const initialDay = initial.birthDay;
      const initialMonth = initial.birthMonth;
      const wantsDay = dayPresent ? Number(birthDay) : null;
      const wantsMonth = monthPresent ? Number(birthMonth) : null;
      const birthdayChanged = wantsDay !== initialDay || wantsMonth !== initialMonth;

      const birthdayPayload: { birthDay?: number | null; birthMonth?: number | null } =
        birthdayChanged
          ? { birthDay: wantsDay, birthMonth: wantsMonth }
          : {};

      await apiFetch("/profile", {
        method: "PATCH",
        body: {
          name: name.trim(),
          phone: phone.trim(),
          addressLine1: line1.trim(),
          addressLine2: line2.trim(),
          addressCity: city.trim(),
          addressPostcode: postcode.trim().toUpperCase(),
          addressCountry: country.trim().toUpperCase() || "GB",
          ...birthdayPayload,
        },
      });
      setSavedAt(new Date());
      // Refresh server components so the admin nav user-name etc. pick
      // up any change without a hard reload.
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const validationList = err.fieldErrors?.errors ?? null;
        if (validationList && validationList.length > 0) {
          setIssues(validationList);
          setError(null);
        } else {
          setError(err.detail);
          setIssues(null);
        }
      } else {
        setError("Couldn't save your profile.");
        setIssues(null);
      }
    } finally {
      setPending(false);
    }
  };

  const fieldClass =
    "w-full border border-cream-200 bg-paper px-3 py-2 font-sans text-sm focus:border-orange-500 focus:outline-none";
  const labelClass =
    "flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700";

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      {issues ? (
        <Alert variant="danger">
          <p className="m-0 mb-2 font-semibold">Please check these details before saving:</p>
          <ul className="m-0 list-disc pl-5 font-sans text-sm">
            {issues.map((issue, idx) => (
              <li key={idx} className="mt-1 first:mt-0">
                {issue}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {error ? <Alert variant="danger">{error}</Alert> : null}

      {savedAt && !error && !issues ? (
        <Alert variant="success">
          Saved at{" "}
          {savedAt.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </Alert>
      ) : null}

      <section>
        <h2 className="m-0 mb-4 font-display text-2xl text-maroon-600">Contact</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Name
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              autoComplete="name"
              minLength={1}
              maxLength={120}
              required
            />
          </label>
          <label className={labelClass}>
            Email
            <input
              className={`${fieldClass} cursor-not-allowed bg-cream-50 text-neutral-500`}
              value={initial.email}
              readOnly
              type="email"
              aria-describedby="email-hint"
            />
            <span id="email-hint" className="font-sans text-xs normal-case tracking-normal text-neutral-500">
              To change your email, go to <strong>Security</strong>.
            </span>
          </label>
          <label className={labelClass}>
            Phone (optional)
            <input
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              autoComplete="tel"
              maxLength={32}
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="m-0 mb-2 font-display text-2xl text-maroon-600">Birthday</h2>
        <p className="mb-4 max-w-prose font-sans text-sm text-neutral-700">
          Members of <strong>The Nimi Indulgence Club</strong> receive a small treat on their
          birthday. We only collect the day and month — never the year — and use it solely to
          send you a one-time discount code each year. Leave it blank if you'd rather opt out.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Day
            <select
              className={fieldClass}
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              aria-label="Birthday day"
            >
              <option value="">— Not set —</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Month
            <select
              className={fieldClass}
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              aria-label="Birthday month"
            >
              <option value="">— Not set —</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {(birthDay !== "" || birthMonth !== "") && (birthDay === "" || birthMonth === "") ? (
          <p className="mt-3 font-sans text-xs text-semantic-danger">
            Please pick both the day and the month — or clear both to remove your birthday.
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="m-0 mb-2 font-display text-2xl text-maroon-600">
          Default delivery address
        </h2>
        <p className="mb-4 max-w-prose font-sans text-sm text-neutral-700">
          This is where we send any Indulgence Club deliveries and where we pre-fill the cart
          at checkout. You can still pick a different address per order if you need to send
          something somewhere else.
        </p>
        <div className="grid gap-4">
          <label className={labelClass}>
            Address line 1
            <input
              className={fieldClass}
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              type="text"
              autoComplete="address-line1"
              maxLength={200}
            />
          </label>
          <label className={labelClass}>
            Address line 2 (optional)
            <input
              className={fieldClass}
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              type="text"
              autoComplete="address-line2"
              maxLength={200}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className={labelClass}>
              City
              <input
                className={fieldClass}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                type="text"
                autoComplete="address-level2"
                maxLength={80}
              />
            </label>
            <label className={labelClass}>
              Postcode
              <input
                className={fieldClass}
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                type="text"
                autoComplete="postal-code"
                minLength={3}
                maxLength={10}
                placeholder="SW1A 1AA"
              />
            </label>
            <label className={labelClass}>
              Country
              <input
                className={fieldClass}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                type="text"
                autoComplete="country"
                minLength={2}
                maxLength={2}
                placeholder="GB"
                aria-describedby="country-hint"
              />
              <span id="country-hint" className="font-sans text-xs normal-case tracking-normal text-neutral-500">
                Two-letter code, e.g. GB.
              </span>
            </label>
          </div>
        </div>
      </section>

      <div className="pt-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
