import { AddToCartButton } from "@/app/(marketing)/cravings/AddToCartButton";
import { TruncatedDescription } from "@/app/(marketing)/cravings/TruncatedDescription";
import { heroBackground } from "@/lib/images";

/**
 * Shared shape for any page that wants to render the public pastry
 * menu. Mirrors `PublicPastry` on the API (`PastriesService.listAvailable`).
 *
 * Extracted into `components/patterns/` so the `/cravings`, `/pastries`,
 * and `/account/pastries` pages can all render the exact same card
 * markup. When the menu card design changes (price treatment, hover
 * states, badges, etc.) there's a single place to edit, not three.
 */
export interface PastryMenuItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMinor: number;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
  tags: string[];
  leadTimeDays: number;
  minQuantity: number;
  batchLimit: number | null;
}

interface Props {
  items: PastryMenuItem[];
  /**
   * `AddToCartButton` branches on this — anonymous visitors write to
   * the localStorage guest cart, authed visitors POST to the server
   * cart. Drilled in from the parent server component (which has
   * access to the session) so the grid stays a server component.
   */
  isAuthed: boolean;
  /**
   * Optional empty-state copy. Each context calls for a slightly
   * different sentence (the public menu page says "menu coming soon",
   * the account view might say "no items available right now"), so
   * we let the caller decide.
   */
  emptyMessage?: string;
}

const fmtGBP = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

/**
 * PastryMenuGrid — server-rendered card grid for the published
 * pastry menu.
 *
 * Layout: two distinct treatments depending on viewport. On mobile
 * (`block ... sm:hidden`) the card stacks photo above a text block on
 * the cream card surface so the description has proper contrast and
 * breathing room. On `sm+` the description gets an editorial overlay
 * across the bottom of the photo with a maroon gradient — more
 * magazine-like, matches the rest of the marketing surface.
 *
 * The "Add to cart" pill floats top-right of the photo at every
 * breakpoint with its own contrast surface so it stays legible even
 * over dark food photography.
 *
 * Per-item rule hints (minimum order quantity) appear in both
 * variants — the mobile one in orange small-caps below the price,
 * the desktop one in cream-tinted small-caps on the gradient. We
 * never surface them when the item has no rules (default minQuantity
 * = 1) so unset items look exactly the same as before this feature.
 */
export function PastryMenuGrid({ items, isAuthed, emptyMessage }: Props) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
        <p className="m-0 font-sans text-base text-neutral-700">
          {emptyMessage ??
            "Menu coming soon. Check back shortly — fresh items drop regularly."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        {items.map((item) => {
          const isLimited = item.tags.includes("limited");
          return (
            <article
              key={item.id}
              className="group relative overflow-hidden border border-cream-200 bg-cream-50"
            >
              <div className="relative">
                <div
                  role="img"
                  aria-label={item.imageAlt ?? `${item.name} — ${item.description ?? ""}`}
                  className="aspect-[4/3] w-full bg-gradient-to-br from-orange-200 to-maroon-700 transition-transform duration-base ease-brand sm:aspect-square sm:group-hover:scale-105"
                  style={
                    item.imageUrl
                      ? heroBackground(item.imageUrl)
                      : { background: "linear-gradient(135deg,#ECA068,#5C1F18)" }
                  }
                />

                <AddToCartButton
                  pastryItemId={item.id}
                  itemName={item.name}
                  isAuthed={isAuthed}
                  slug={item.slug}
                  description={item.description ?? null}
                  imageUrl={item.imageUrl ?? null}
                  unitPriceMinor={item.priceMinor}
                  currency={item.currency}
                />

                {/* Desktop editorial overlay (sm+). */}
                <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-maroon-700/95 via-maroon-700/60 to-transparent p-4 pt-10 sm:block">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="m-0 font-display text-lg font-medium text-cream-50">
                      {item.name}
                    </h3>
                    <span className="font-display text-sm font-medium text-cream-50/90">
                      {fmtGBP(item.priceMinor, item.currency)}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="m-0 font-sans text-xs text-cream-50/85">
                      {item.description}
                    </p>
                  ) : null}
                  {item.minQuantity > 1 ? (
                    <p className="m-0 mt-1 font-sans text-2xs uppercase tracking-[0.18em] text-orange-300">
                      Min {item.minQuantity} per order
                    </p>
                  ) : null}
                </div>

                {isLimited ? (
                  <span className="absolute left-3 top-3 rounded-pill bg-orange-500 px-2 py-1 font-sans text-2xs font-semibold uppercase tracking-wider text-cream-50">
                    Limited batch
                  </span>
                ) : null}
              </div>

              {/* Mobile-only text block (below `sm`). */}
              <div className="block px-4 py-4 sm:hidden">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="m-0 font-display text-2xl font-semibold text-maroon-700">
                    {item.name}
                  </h3>
                  <span className="font-display text-lg font-medium text-orange-700">
                    {fmtGBP(item.priceMinor, item.currency)}
                  </span>
                </div>
                {item.minQuantity > 1 ? (
                  <p className="m-0 mt-1 font-sans text-xs uppercase tracking-[0.16em] text-orange-700">
                    Minimum {item.minQuantity} per order
                  </p>
                ) : null}
                {item.description ? (
                  <TruncatedDescription text={item.description} />
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
