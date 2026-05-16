"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/patterns/Card";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { Tag } from "@/components/primitives/Tag";
import { ApiError, apiFetch } from "@/lib/api";
import { heroBackground, images } from "@/lib/images";

const PLAN_IMAGES = [images.cravings.small, images.cravings.medium, images.cravings.large];

interface PublicPlan {
  slug: string;
  name: string;
  description: string | null;
  monthlyAmountMinor: number;
  currency: string;
  position: number;
  /** API returns this; when false the tier is shown disabled with "Coming soon". */
  stripeReady?: boolean;
}

interface Props {
  plans: PublicPlan[];
}

/**
 * PlanGrid — three plan cards rendered on the Indulgence Club page.
 * Clicking "Join" calls the API which returns a Stripe Checkout URL we
 * redirect to. If the user isn't logged in we send them to /login with a
 * `next=/cravings` callback so they come back to the same page after auth.
 */
export function PlanGrid({ plans }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async (slug: string) => {
    setError(null);
    setPending(slug);
    try {
      const result = await apiFetch<{ url: string }>("/cravings/subscribe", {
        method: "POST",
        body: { planSlug: slug },
      });
      window.location.assign(result.url);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/cravings");
        return;
      }
      setError(err instanceof ApiError ? err.detail : "Couldn't start checkout. Please try again.");
    } finally {
      setPending(null);
    }
  };

  // When the API returns zero plans (table not seeded yet, or every tier
  // hidden by the admin) we show an honest "coming soon" panel instead
  // of a clickable card whose Join action would 404 / 503. This mirrors
  // the server-side behaviour after the fallback-data removal.
  if (plans.length === 0) {
    return (
      <div className="border border-dashed border-cream-200 bg-paper px-6 py-10 text-center">
        <p className="m-0 mb-2 font-display text-2xl text-maroon-600">
          The Indulgence Club is opening soon.
        </p>
        <p className="m-0 max-w-prose font-sans text-base text-neutral-700 mx-auto">
          Tiers are getting their final touches. Subscribe to the newsletter — or
          reach out via the contact form — and we&rsquo;ll let you know the moment
          membership opens.
        </p>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      ) : null}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p, i) => {
          const flagship = i === 1; // middle plan emphasised
          const ready = p.stripeReady !== false; // undefined → assume true (backwards-compat)
          const fmt = new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: p.currency.toUpperCase(),
          });
          return (
            <Card
              key={p.slug}
              eyebrow={flagship ? "Most popular" : `Tier ${i + 1}`}
              title={fmt.format(p.monthlyAmountMinor / 100) + " / month"}
              description={p.description ?? p.name}
              {...(flagship ? { flagship: true } : {})}
              mediaStyle={heroBackground(PLAN_IMAGES[i] ?? images.cravings.medium)}
            >
              <div className="mb-4 flex flex-wrap gap-2">
                <Tag>3-mo minimum</Tag>
                <Tag>Credits valid 3 mo</Tag>
                {!ready ? <Tag variant="orange">Coming soon</Tag> : null}
              </div>
              <Button
                variant={flagship ? "primary" : "secondary"}
                size="sm"
                onClick={() => void subscribe(p.slug)}
                disabled={pending !== null || !ready}
                title={
                  !ready
                    ? "This tier is being finalised — checkout opens once the admin connects it to Stripe."
                    : undefined
                }
              >
                {!ready
                  ? "Coming soon"
                  : pending === p.slug
                  ? "Redirecting…"
                  : "Join the club"}
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
