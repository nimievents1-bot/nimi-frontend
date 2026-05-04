import { clientEnv } from "./env";

/**
 * API client — thin typed wrapper around fetch.
 *
 * Browser calls go to `NEXT_PUBLIC_API_URL` (the public origin).
 * Server-side calls (in Server Components / Route Handlers) go to
 * `INTERNAL_API_URL` so they can use the private network when deployed.
 *
 * Cookies are forwarded with `credentials: "include"`. The API authenticates
 * the request from the `nimi_at` cookie; the browser handles refresh
 * by calling `apiFetch("/auth/refresh", { method: "POST" })` when a 401 is
 * returned (handled in the React layer via a hook, not here).
 */

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** When true, throws ApiError instead of returning a non-OK Response. Default true. */
  throwOnError?: boolean;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail: string,
    public readonly requestId?: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(`${status} ${title}: ${detail}`);
    this.name = "ApiError";
  }
}

interface ProblemDetails {
  status?: number;
  title?: string;
  detail?: string;
  requestId?: string;
  errors?: string[];
}

/**
 * Resolve the base URL the next fetch will hit.
 *
 *   Server-side (Node runtime — SSR / Route Handlers / Server Actions):
 *     Talk directly to the Railway API via `INTERNAL_API_URL`. Falls back
 *     to `NEXT_PUBLIC_API_URL` for environments that haven't split the env
 *     vars apart. Direct calls avoid the Vercel-rewrite round-trip and are
 *     ~50–100ms faster than going browser → Vercel proxy → Railway.
 *
 *   Browser (any client-side fetch in a "use client" component):
 *     Return an empty string so URLs resolve to relative same-origin paths
 *     (`/api/v1/...`). Those hit Vercel's `rewrites()` rule in
 *     `next.config.mjs`, which transparently proxies to Railway. The
 *     critical effect: Set-Cookie headers attach to *our* domain
 *     (`nimievents.com`), not the Railway API origin, so cookies persist
 *     across the rest of the user's session.
 */
const apiBase = (): string => {
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL ?? clientEnv.NEXT_PUBLIC_API_URL;
  }
  return ""; // browser → same-origin; Vercel rewrite handles the upstream
};

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const { body, throwOnError = true, headers, ...rest } = opts;

  const init: RequestInit = {
    credentials: "include",
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
  };

  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const url = path.startsWith("http") ? path : `${apiBase()}/api/v1${path}`;
  const res = await fetch(url, init);

  // 204 / 205 / 304 — no body to parse.
  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text.length ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    if (!throwOnError) return data as T;
    const problem = (data ?? {}) as ProblemDetails;
    throw new ApiError(
      res.status,
      problem.title ?? res.statusText ?? "Request failed",
      problem.detail ?? "Please try again or contact support.",
      problem.requestId,
      Array.isArray(problem.errors) ? { errors: problem.errors } : undefined,
    );
  }

  return data as T;
}
