import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

interface Kpi {
  label: string;
  value: number;
  display?: string;
  group: "operations" | "commerce" | "growth";
}

interface KpiResponse {
  kpis: Kpi[];
  generatedAt: string;
}

const QUICK_LINKS = [
  { label: "Open enquiries", href: "/admin/enquiries?status=NEW" },
  { label: "Pending design approval", href: "/admin/orders?status=AWAITING_DESIGN_APPROVAL" },
  { label: "All gift orders", href: "/admin/orders" },
  { label: "Cravings subscribers", href: "/admin/cravings" },
  { label: "Edit content", href: "/admin/content" },
  { label: "Write a journal post", href: "/admin/blog/new" },
] as const;

const GROUP_LABEL: Record<Kpi["group"], string> = {
  operations: "Operations",
  commerce: "Commerce",
  growth: "Growth",
};

export default async function AdminDashboardPage() {
  const cookieHeader = (await cookies()).toString();

  let kpis: Kpi[] = [];
  let generatedAt: string | null = null;
  let error: string | null = null;
  try {
    const data = await apiFetch<KpiResponse>("/admin/kpis", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    kpis = data.kpis;
    generatedAt = data.generatedAt;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load KPIs.";
  }

  const grouped: Record<Kpi["group"], Kpi[]> = {
    operations: [],
    commerce: [],
    growth: [],
  };
  for (const k of kpis) grouped[k.group].push(k);

  return (
    <>
      <p className="eyebrow mb-2">Admin</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">Dashboard</h1>
      {generatedAt ? (
        <p className="mb-8 font-sans text-sm text-neutral-500">
          Updated {new Date(generatedAt).toLocaleTimeString()}.
        </p>
      ) : null}

      {error ? (
        <p className="mb-6 font-sans text-sm text-semantic-danger">{error}</p>
      ) : null}

      {(["operations", "commerce", "growth"] as const).map((group) => (
        <section key={group} className="mb-10">
          <h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.26em] text-maroon-700">
            {GROUP_LABEL[group]}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {grouped[group].map((k) => (
              <div
                key={k.label}
                className="border border-cream-200 bg-paper p-5 transition-colors duration-base hover:border-orange-200"
              >
                <p className="m-0 font-sans text-xs uppercase tracking-[0.18em] text-neutral-500">
                  {k.label}
                </p>
                <p className="m-0 mt-2 font-display text-3xl font-medium text-maroon-600">
                  {k.display ?? k.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.26em] text-maroon-700">
          Quick links
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="border border-cream-200 bg-paper px-5 py-4 font-display text-lg text-maroon-600 transition-colors duration-base hover:border-orange-200 hover:text-orange-700"
            >
              {q.label} →
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-10 max-w-prose font-sans text-sm text-neutral-500">
        KPI snapshot is live; numbers reflect current database state. The audit log is at{" "}
        <Link href="/admin/audit" className="text-orange-600 underline underline-offset-4">
          /admin/audit
        </Link>
        .
      </p>
    </>
  );
}
