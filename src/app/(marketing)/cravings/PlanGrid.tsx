"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/patterns/Card";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
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
}

interface Props {
  plans: PublicPlan[];
}

/**
 * PlanGrid — three plan cards. Clicking "Subscribe" calls the API which
 * returns a Stripe Checkout URL we redirect to. If the user isn't logged
 * in, we redirect to /login with a `next=/cravings` so they come back here
 * after authenticating.
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
          const fmt = new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: p.currency.toUpperCase(),
          });
          return (
            <Card
              key={p.slug}
              eyebrow={flagship ? "Most popular" : "Cravings"}
              title={fmt.format(p.monthlyAmountMinor / 100) + " / month"}
              description={p.description ?? p.name}
              {...(flagship ? { flagship: true } : {})}
              mediaStyle={heroBackground(PLAN_IMAGES[i] ?? images.cravings.medium)}
            >
              <Button
                variant={flagship ? "primary" : "secondary"}
                size="sm"
                onClick={() => void subscribe(p.slug)}
                disabled={pending !== null}
              >
                {pending === p.slug ? "Redirecting…" : "Subscribe"}
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
