"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/primitives/Button";

/**
 * Brand-aligned confirmation dialog.
 *
 * Replaces native `window.confirm()` calls — those render the bare
 * "www.nimievents.com says" Chrome chrome and break the design language
 * entirely. This component lives in our visual system: square edges,
 * Cormorant Garamond display title, cream-on-paper palette, maroon /
 * danger CTAs.
 *
 * Accessibility:
 *   - role="dialog" with aria-modal=true
 *   - Title / description wired through aria-labelledby + aria-describedby
 *   - Focus trapped inside while open (Tab cycles within the dialog)
 *   - ESC dismisses (treated as cancel)
 *   - Backdrop click dismisses (treated as cancel)
 *   - Returns focus to the element that opened the dialog
 *   - Background scroll locked while open
 *
 * Usage — preferred (via the hook, see ConfirmProvider below):
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title: "...", description: "...", variant: "danger" });
 *   if (ok) await doDestructiveThing();
 *
 * The standalone component is exported for occasional bespoke modals
 * that need to live alongside other UI (e.g. inline within a card).
 */

export type ConfirmVariant = "default" | "danger";

export interface ConfirmOptions {
  /** Heading rendered in display type — keep it short. */
  title: string;
  /** Supporting body text. Used as the dialog's aria-describedby content. */
  description: string;
  /** Label on the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label on the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** "danger" → maroon confirm button for destructive actions. */
  variant?: ConfirmVariant;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Presentational dialog. The provider below drives it; you can also use
 * it directly when you want fully-controlled state.
 */
export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousActiveRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mount portal only after first client render so SSR is stable.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Manage focus, scroll lock, and ESC handling whenever `open` flips.
  useEffect(() => {
    if (!open) return;

    previousActiveRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog. Default to the cancel button so a
    // misclick / accidental Enter doesn't immediately confirm a
    // potentially destructive action.
    const target =
      variant === "danger" ? cancelRef.current : confirmRef.current ?? cancelRef.current;
    target?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key === "Tab") {
        // Tiny focus trap: keep focus on the two action buttons.
        const focusables = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
        if (focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      // Restore focus to whatever opened us.
      if (previousActiveRef.current instanceof HTMLElement) {
        previousActiveRef.current.focus();
      }
    };
  }, [open, onCancel, variant]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      // Backdrop. mousedown (not click) prevents accidental cancel from a
      // text-selection drag that ends outside the dialog.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-maroon-700/50 px-page-gutter py-10 backdrop-blur-sm"
      aria-hidden={false}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md border border-cream-200 bg-paper shadow-2xl"
        // Stop mousedown on the panel from reaching the backdrop handler.
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="px-7 pt-6 pb-5">
          <p className="eyebrow mb-2">
            {variant === "danger" ? "Confirm" : "Heads up"}
          </p>
          <h2
            id={titleId}
            className="m-0 mb-3 font-display text-3xl font-medium text-maroon-600"
          >
            {title}
          </h2>
          <p id={descriptionId} className="m-0 font-sans text-base text-neutral-700">
            {description}
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-cream-200 bg-cream-50 px-7 py-4">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            // The danger variant lives via a className override so we
            // don't have to add a new Button variant for the one place
            // it appears. Matches the established pattern used by the
            // existing destructive CTAs (PastryEditor's Delete).
            className={
              variant === "danger"
                ? "!bg-maroon-700 hover:!bg-maroon-600 focus-visible:outline-maroon-600"
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------
// Hook + Provider — the ergonomic API
// ---------------------------------------------------------------------

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Returns a function that opens the confirm dialog and resolves with
 * `true` if the user confirmed, `false` if they cancelled or ESC'd.
 *
 * Falls back to `window.confirm` if the provider isn't mounted, so a
 * stray import doesn't crash storybook or unit tests.
 */
export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (fn) return fn;
  return async (opts) => {
    if (typeof window === "undefined") return false;
    // eslint-disable-next-line no-alert
    return window.confirm(`${opts.title}\n\n${opts.description}`);
  };
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * Wrap the app in this provider so `useConfirm()` works anywhere. A
 * single shared dialog instance avoids the stacked-modal problem and
 * keeps focus management predictable.
 *
 * Mount it inside the root layout's body. It renders only a portal, so
 * it does not affect layout.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve });
      }),
    [],
  );

  const close = useCallback(
    (value: boolean) => {
      setPending((current) => {
        current?.resolve(value);
        return null;
      });
    },
    [],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        confirmLabel={pending?.confirmLabel ?? "Confirm"}
        cancelLabel={pending?.cancelLabel ?? "Cancel"}
        variant={pending?.variant ?? "default"}
      />
    </ConfirmContext.Provider>
  );
}
