"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/cn";

/**
 * Header-mounted bell icon with an unread-count badge and a dropdown
 * showing the most recent notifications.
 *
 * Both the customer surface (marketing header) and the admin surface
 * use this same component — the API decides what's in each user's
 * inbox based on JWT identity.
 *
 * Live updates:
 *   - On mount we fetch the list once.
 *   - We re-poll the unread count every 30 s (cheap endpoint, just a
 *     number — no list payload).
 *   - We re-fetch the full list on `focus` (returning to the tab) and
 *     when the dropdown opens, so opening it always shows the freshest
 *     state.
 *   - When the user clicks a notification or "Mark all as read", we
 *     update local state optimistically and then sync server-side.
 *
 * Auth:
 *   - The notifications endpoint is JWT-guarded. Anonymous visitors
 *     never see this component — the parent Header skips rendering it.
 *
 * Accessibility:
 *   - Button uses `aria-expanded` / `aria-haspopup="menu"`.
 *   - Dropdown has `role="menu"`, items are `role="menuitem"`.
 *   - ESC closes; clicks outside the panel close.
 *   - The count is announced via the `aria-label` ("Notifications, 3 unread").
 */

interface NotificationRow {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
}

interface ListResponse {
  rows: NotificationRow[];
  unreadCount: number;
}

const POLL_INTERVAL_MS = 30_000;

interface Props {
  onDark?: boolean;
}

export function NotificationBell({ onDark = false }: Props) {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  // Where to draw the dropdown when it's portalled to <body>. Computed
  // from the bell button's `getBoundingClientRect` whenever the panel
  // opens (and recomputed on scroll/resize while open) — we use
  // `position: fixed` so viewport coordinates are correct.
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  // SSR-safety gate for createPortal — document.body doesn't exist
  // during server render. We render the trigger server-side but
  // hydrate the portal only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Pull the full list (rows + unread count) — used on mount, on focus,
  // and when the dropdown opens.
  const refreshList = useCallback(async () => {
    try {
      const data = await apiFetch<ListResponse>("/notifications?limit=20");
      setRows(data.rows);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silent — anonymous-ish failures shouldn't pollute the chrome.
      setRows([]);
      setUnreadCount(0);
    }
  }, []);

  // Lightweight poll — just the count, not the list. Used to keep the
  // badge fresh without re-rendering the dropdown when it's closed.
  const refreshCount = useCallback(async () => {
    try {
      const data = await apiFetch<{ count: number }>("/notifications/unread-count");
      setUnreadCount(data.count);
    } catch {
      // Ignore.
    }
  }, []);

  useEffect(() => {
    void refreshList();
    const onFocus = () => void refreshList();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(() => void refreshCount(), POLL_INTERVAL_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [refreshList, refreshCount]);

  // Re-fetch the list when the user opens the dropdown so they see the
  // freshest payload even if the periodic count poll triggered a stale
  // local list.
  useEffect(() => {
    if (open) void refreshList();
  }, [open, refreshList]);

  // Re-anchor the dropdown to the bell whenever it opens, and keep it
  // in sync while open (scroll, resize, orientation change). We use
  // viewport coordinates because the dropdown is portalled to
  // <body> with `position: fixed` to escape the header's stacking
  // context — anything else and it'd be trapped behind the page
  // content the moment it tried to overflow the header's box.
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({
        top: rect.bottom + 8, // 8px gap below the bell
        right: window.innerWidth - rect.right,
      });
    };
    reposition();
    window.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  // Close on outside click + ESC. We need to allow clicks INSIDE the
  // portalled panel (which lives at <body>, not inside wrapperRef),
  // so we tag the panel with `data-notification-panel` and let those
  // through.
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (wrapperRef.current && wrapperRef.current.contains(target)) return;
      // Allow clicks inside the portalled panel (resolved by walking
      // up from the click target looking for our marker attribute).
      let el: Node | null = target;
      while (el && el !== document) {
        if (
          el instanceof HTMLElement &&
          el.getAttribute("data-notification-panel") === "true"
        ) {
          return;
        }
        el = el.parentNode;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = async (id: string) => {
    // Optimistic flip. Reverting on failure would be flicker-y; we
    // prefer a confident UI and rely on the next refresh to reconcile
    // if the API call somehow lost.
    setRows((prev) => prev.map((r) => (r.id === id && !r.read ? { ...r, read: true } : r)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
    } catch {
      // Fall through to refresh.
      void refreshList();
    }
  };

  const markAllRead = async () => {
    setRows((prev) => prev.map((r) => ({ ...r, read: true })));
    setUnreadCount(0);
    try {
      await apiFetch("/notifications/read-all", { method: "POST" });
    } catch {
      void refreshList();
    }
  };

  const ariaLabel =
    unreadCount === 0
      ? "Notifications, none unread"
      : unreadCount === 1
      ? "Notifications, 1 unread"
      : `Notifications, ${unreadCount} unread`;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center transition-colors duration-fast ease-brand",
          onDark
            ? "text-cream-50 hover:text-orange-300"
            : "text-maroon-700 hover:text-orange-700",
        )}
      >
        {/* Bell glyph hand-tuned at 24×24 to sit at the same visual
            weight as the cart icon next to it. */}
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 4.5 1.5 6 2 7H4c.5-1 2-2.5 2-7Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center px-1 font-sans text-[0.6875rem] font-semibold leading-none",
              onDark ? "bg-cream-50 text-maroon-700" : "bg-maroon-600 text-cream-50",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {/*
        Dropdown panel — portalled to <body> with `position: fixed` so
        it escapes the sticky header's stacking context and is never
        clipped or overlapped by page content. Position is anchored
        to the bell button via the `reposition` effect above; we
        recompute on scroll/resize to keep it pinned.
        Why a portal and not just a higher z-index: the parent
        <header> uses `backdrop-blur`, which creates its own
        stacking context. Any z-index applied inside that context
        is capped at the header's outer z-40 from the rest of the
        page's perspective — so page content with `position: relative`
        was paining straight through the dropdown. Rendering at body
        sidesteps the trap entirely.
      */}
      {mounted && open && anchor
        ? createPortal(
        <div
          data-notification-panel="true"
          role="menu"
          aria-label="Notifications"
          style={{
            position: "fixed",
            top: anchor.top,
            right: anchor.right,
            zIndex: 80,
          }}
          className="w-80 max-w-[calc(100vw-2rem)] border border-cream-200 bg-paper shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-cream-200 bg-cream-50 px-4 py-3">
            <p className="m-0 font-display text-lg text-maroon-600">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="font-sans text-xs font-medium uppercase tracking-[0.16em] text-orange-700 hover:text-orange-800"
              >
                Mark all read
              </button>
            ) : null}
          </header>

          {rows.length === 0 ? (
            <p className="m-0 px-4 py-8 text-center font-sans text-sm text-neutral-700">
              You&rsquo;re all caught up.
            </p>
          ) : (
            <ul className="m-0 max-h-96 list-none overflow-y-auto p-0">
              {rows.map((row) => {
                const created = new Date(row.createdAt);
                const when = created.toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const content = (
                  <div
                    className={cn(
                      "block border-b border-cream-200 px-4 py-3 transition-colors",
                      row.read ? "bg-paper" : "bg-orange-50",
                      "hover:bg-cream-100",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={cn(
                          "m-0 font-sans text-sm leading-snug",
                          row.read ? "text-neutral-700" : "font-semibold text-maroon-700",
                        )}
                      >
                        {row.title}
                      </p>
                      {!row.read ? (
                        <span
                          aria-hidden="true"
                          className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"
                        />
                      ) : null}
                    </div>
                    {row.body ? (
                      <p className="m-0 mt-1 font-sans text-xs text-neutral-700">
                        {row.body}
                      </p>
                    ) : null}
                    <p className="m-0 mt-1 font-sans text-xs text-neutral-500">{when}</p>
                  </div>
                );
                return (
                  <li key={row.id} role="menuitem">
                    {row.href ? (
                      <Link
                        href={row.href}
                        onClick={() => {
                          void markRead(row.id);
                          setOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void markRead(row.id)}
                        className="block w-full text-left"
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>,
            document.body,
          )
        : null}
    </div>
  );
}
