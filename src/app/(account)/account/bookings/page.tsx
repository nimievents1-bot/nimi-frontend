import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Bookings",
  robots: { index: false, follow: false },
};

/**
 * Customer-facing bookings page — every catering or events enquiry the
 * signed-in customer has submitted. Matched by account email server-side
 * (`GET /contact/mine`), so a customer can only ever see their own
 * submissions. Sorted newest first.
 *
 * Empty state nudges the customer to the public enquiry forms so they
 * have a clear next action rather than a dead screen.
 */

type EnquiryKind = "GENERAL" | "CATERING" | "EVENT" | "GIFTING" | "PRESS" | "PARTNERSHIP";
type EnquiryStatus = "NEW" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "SPAM";

interface Enquiry {
  id: string;
  kind: EnquiryKind;
  status: EnquiryStatus;
  notes: string;
  eventDate: string | null;
  eventType: string | null;
  guestCount: number | null;
  budgetBand: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Status to chip-variant + customer-facing label. We translate the
 * internal pipeline (NEW / IN_PROGRESS / etc.) into wording that makes
 * sense to a customer reading their own enquiry list.
 */
const STATUS_DISPLAY: Record<EnquiryStatus, { label: string; variant: "neutral" | "orange" | "success" | "maroon" }> = {
  NEW: { label: "Received", variant: "orange" },
  IN_PROGRESS: { label: "Our team is on it", variant: "orange" },
  WAITING_ON_CUSTOMER: { label: "Awaiting your reply", variant: "maroon" },
  RESOLVED: { label: "Resolved", variant: "success" },
  // SPAM is filtered out server-side; never surfaced.
  SPAM: { label: "Closed", variant: "neutral" },
};

/** Friendly label for each enquiry kind. */
const KIND_LABEL: Record<EnquiryKind, string> = {
  GENERAL: "General enquiry",
  CATERING: "Catering",
  EVENT: "Event planning",
  GIFTING: "Gifting",
  PRESS: "Press",
  PARTNERSHIP: "Partnership",
};

export default async function AccountBookingsPage() {
  // Force a fresh auth check so a redirect to /login fires immediately
  // if the session has lapsed since the user navigated here.
  await requireSessionUser();
  const cookieHeader = (await cookies()).toString();

  let rows: Enquiry[] = [];
  let error: string | null = null;
  try {
    rows = await apiFetch<Enquiry[]>("/contact/mine", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Couldn't load your bookings.";
  }

  return (
    <>
      <p className="eyebrow mb-2">Account · Bookings</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        Your bookings
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Every catering and events enquiry you&rsquo;ve sent us, with the latest status. Replies
        from our team arrive by email — this page is your at-a-glance reference.
      </p>

      {error ? (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      ) : null}

      {!error && rows.length === 0 ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 mb-3 font-display text-2xl text-maroon-600">
            No bookings yet.
          </p>
          <p className="m-0 mb-6 max-w-prose font-sans text-base text-neutral-700 mx-auto">
            When you reach out about a catering or events booking, your enquiry will appear here so
            you can follow its progress.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/catering"
              className="inline-flex items-center justify-center bg-orange-600 px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-cream-50 hover:bg-orange-700"
            >
              Enquire about catering
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center border border-cream-200 bg-cream-100 px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-maroon-700 hover:border-orange-200 hover:bg-orange-100"
            >
              Plan an event
            </Link>
          </div>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="grid gap-4">
          {rows.map((row) => {
            const display = STATUS_DISPLAY[row.status];
            const eventDate = row.eventDate ? new Date(row.eventDate) : null;
            return (
              <article
                key={row.id}
                className="border border-cream-200 bg-paper p-6"
                aria-label={`${KIND_LABEL[row.kind]} enquiry from ${new Date(row.createdAt).toLocaleDateString()}`}
              >
                <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow m-0 mb-1">{KIND_LABEL[row.kind]}</p>
                    <p className="m-0 font-display text-xl text-maroon-600">
                      {row.eventType ?? "Booking enquiry"}
                    </p>
                  </div>
                  <Tag variant={display.variant}>{display.label}</Tag>
                </header>

                <dl className="grid gap-x-6 gap-y-2 font-sans text-sm text-neutral-700 md:grid-cols-3">
                  {eventDate ? (
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                        Event date
                      </dt>
                      <dd className="text-neutral-800">
                        {eventDate.toLocaleDateString("en-GB", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </dd>
                    </div>
                  ) : null}
                  {row.guestCount ? (
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                        Guests
                      </dt>
                      <dd className="text-neutral-800">{row.guestCount}</dd>
                    </div>
                  ) : null}
                  {row.budgetBand ? (
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                        Budget
                      </dt>
                      <dd className="text-neutral-800">{row.budgetBand}</dd>
                    </div>
                  ) : null}
                </dl>

                {row.notes ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-sans text-sm font-medium text-orange-700 hover:text-orange-800">
                      View your message
                    </summary>
                    <p className="mt-3 whitespace-pre-line border-l-2 border-cream-200 pl-4 font-sans text-sm text-neutral-700">
                      {row.notes}
                    </p>
                  </details>
                ) : null}

                <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-cream-200 pt-3 font-sans text-xs text-neutral-500">
                  <span>
                    Sent {new Date(row.createdAt).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {row.updatedAt !== row.createdAt ? (
                    <span>
                      Updated {new Date(row.updatedAt).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : null}
                </footer>
              </article>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
