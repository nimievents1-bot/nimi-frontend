import { apiFetch } from "@/lib/api";

import { Testimonial as TestimonialCard } from "./Testimonial";

/**
 * Public testimonial shape returned by `/v1/testimonials/published`.
 * Kept narrow on purpose — the API only exposes display-safe fields.
 */
interface PublicTestimonial {
  id: string;
  authorName: string;
  role: string | null;
  body: string;
  rating: number | null;
  eventType: string | null;
}

interface ApiResponse {
  rows: PublicTestimonial[];
  total: number;
}

/**
 * Placeholder testimonials used until the founder enters real ones via
 * `/admin/testimonials`. These are clearly fictional but realistic, so the
 * homepage never looks empty during the soft-launch window.
 *
 * REPLACE BY publishing real testimonials in admin (with consent), at which
 * point the API takes over and these are never rendered.
 */
const PLACEHOLDERS: PublicTestimonial[] = [
  {
    id: "placeholder-1",
    authorName: "Ada & Tobi",
    role: "Wedding · September 2025",
    body: "Nimi catered our 200-guest wedding and the kitchen ran like a metronome. Two months on, our families are still talking about the puff-puff and pepper-soup station.",
    rating: 5,
    eventType: "wedding",
  },
  {
    id: "placeholder-2",
    authorName: "Lateef A.",
    role: "Corporate launch · Manchester",
    body: "From the brief to the breakdown, everything was considered. Our investors arrived to a room that felt curated, and the food was the headline of the evening.",
    rating: 5,
    eventType: "corporate",
  },
  {
    id: "placeholder-3",
    authorName: "Chioma O.",
    role: "Birthday brunch · 30 guests",
    body: "I asked for 'a little African, a little British, a lot of love' and that's exactly what they delivered. The asun shawarma had a queue.",
    rating: 5,
    eventType: "private",
  },
  {
    id: "placeholder-4",
    authorName: "James + Anu",
    role: "Wedding · Yorkshire",
    body: "We were nervous about the logistics — outdoor venue, two cuisines, 180 plates. The Nimi team didn't break a sweat. Our coordinator made the day feel quiet on our side.",
    rating: 5,
    eventType: "wedding",
  },
  {
    id: "placeholder-5",
    authorName: "Sade M.",
    role: "Indulgence Club member · 6 months",
    body: "I joined for the priority access and stayed for the surprises. The monthly drop is the most quietly thoughtful thing in my month.",
    rating: 5,
    eventType: "subscription",
  },
  {
    id: "placeholder-6",
    authorName: "Marcus & team",
    role: "Corporate gifting · 80 boxes",
    body: "Our holiday gift to clients had to feel personal at scale. The Heritage Collection nailed it — the unboxing reactions are still rolling in.",
    rating: 5,
    eventType: "gifting",
  },
];

/**
 * Server component — fetches published testimonials with caching and falls
 * back to the curated placeholder list if the API is unavailable or empty.
 *
 * The grid renders six cards on desktop (3 across, 2 rows) and stacks on
 * mobile. Quotes use the existing `<Testimonial>` primitive so the visual
 * voice stays consistent with the single-testimonial component the home
 * page used to render.
 */
export async function Testimonials({ limit = 6 }: { limit?: number } = {}) {
  let rows: PublicTestimonial[] = [];

  try {
    const data = await apiFetch<ApiResponse>(
      `/testimonials/published?limit=${limit}`,
      {
        method: "GET",
        next: { revalidate: 300, tags: ["testimonials"] },
        throwOnError: true,
      },
    );
    rows = data.rows;
  } catch {
    // Fall through to placeholders silently — the homepage shouldn't break
    // because the API is briefly down or the table is empty pre-launch.
  }

  if (rows.length === 0) {
    rows = PLACEHOLDERS.slice(0, limit);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((t) => {
        // Build attribution string up-front so TS narrows the role check
        // and we don't end up with "Name · null" if role is null.
        const attribution = t.role
          ? `${t.authorName} · ${t.role}`
          : t.authorName;

        // Conditional spread for the optional prop — `exactOptionalPropertyTypes`
        // refuses a literal `undefined` for an optional `rating?: number`.
        const ratingProps = t.rating !== null ? { rating: t.rating } : {};

        return (
          <TestimonialCard
            key={t.id}
            quote={t.body}
            attribution={attribution}
            {...ratingProps}
          />
        );
      })}
    </div>
  );
}
