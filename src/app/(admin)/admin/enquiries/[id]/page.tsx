import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

import { EnquiryActions } from "./EnquiryActions";

export const metadata = { robots: { index: false, follow: false } };

interface Enquiry {
  id: string;
  kind: string;
  status: "NEW" | "CONTACTED" | "CLOSED" | "SPAM";
  name: string;
  email: string;
  phone: string | null;
  eventDate: string | null;
  eventType: string | null;
  guestCount: number | null;
  budgetBand: string | null;
  dietary: string | null;
  notes: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  internalNotes: string | null;
  handledBy: string | null;
  handledAt: string | null;
}

const statusVariant: Record<Enquiry["status"], "orange" | "neutral" | "success" | "maroon"> = {
  NEW: "orange",
  CONTACTED: "neutral",
  CLOSED: "success",
  SPAM: "maroon",
};

export default async function AdminEnquiryDetail({ params }: { params: { id: string } }) {
  const cookieHeader = (await cookies()).toString();

  let enquiry: Enquiry | null = null;
  try {
    enquiry = await apiFetch<Enquiry>(`/admin/enquiries/${params.id}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch {
    notFound();
  }

  if (!enquiry) notFound();

  return (
    <>
      <p className="eyebrow mb-2">Admin · Enquiries · {enquiry.kind}</p>
      <h1 className="m-0 mb-3 font-display text-4xl font-medium text-maroon-600">
        {enquiry.name}
      </h1>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Tag variant={statusVariant[enquiry.status]}>{enquiry.status}</Tag>
        <Tag variant="maroon">{enquiry.kind}</Tag>
        <span className="font-sans text-sm text-neutral-500">
          received {new Date(enquiry.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <section className="mb-8 border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">Contact</h2>
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 font-sans text-base">
              <dt className="text-neutral-500">Name</dt>
              <dd className="text-neutral-800">{enquiry.name}</dd>
              <dt className="text-neutral-500">Email</dt>
              <dd className="text-neutral-800">
                <a className="text-orange-600 underline underline-offset-4" href={`mailto:${enquiry.email}`}>
                  {enquiry.email}
                </a>
              </dd>
              {enquiry.phone ? (
                <>
                  <dt className="text-neutral-500">Phone</dt>
                  <dd className="text-neutral-800">{enquiry.phone}</dd>
                </>
              ) : null}
              {enquiry.eventDate ? (
                <>
                  <dt className="text-neutral-500">Event date</dt>
                  <dd className="text-neutral-800">
                    {new Date(enquiry.eventDate).toLocaleDateString()}
                  </dd>
                </>
              ) : null}
              {enquiry.eventType ? (
                <>
                  <dt className="text-neutral-500">Event type</dt>
                  <dd className="text-neutral-800">{enquiry.eventType}</dd>
                </>
              ) : null}
              {enquiry.guestCount !== null ? (
                <>
                  <dt className="text-neutral-500">Guests</dt>
                  <dd className="text-neutral-800">{enquiry.guestCount}</dd>
                </>
              ) : null}
              {enquiry.budgetBand ? (
                <>
                  <dt className="text-neutral-500">Budget</dt>
                  <dd className="text-neutral-800">{enquiry.budgetBand}</dd>
                </>
              ) : null}
              {enquiry.dietary ? (
                <>
                  <dt className="text-neutral-500">Dietary</dt>
                  <dd className="text-neutral-800">{enquiry.dietary}</dd>
                </>
              ) : null}
              {enquiry.source ? (
                <>
                  <dt className="text-neutral-500">Source</dt>
                  <dd className="text-neutral-700">{enquiry.source}</dd>
                </>
              ) : null}
            </dl>
          </section>

          <section className="mb-8 border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
              Their message
            </h2>
            <p className="m-0 whitespace-pre-wrap font-sans text-base leading-relaxed text-neutral-800">
              {enquiry.notes}
            </p>
          </section>
        </div>

        <aside>
          <EnquiryActions
            enquiryId={enquiry.id}
            currentStatus={enquiry.status}
            currentInternalNotes={enquiry.internalNotes ?? ""}
            recipientEmail={enquiry.email}
          />
        </aside>
      </div>
    </>
  );
}
