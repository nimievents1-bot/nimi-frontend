"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
  useState,
} from "react";

import { cn } from "@/lib/cn";

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" clipRule="evenodd" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 0 0-1.414 1.414l14 14a1 1 0 0 0 1.414-1.414l-1.473-1.473A10.014 10.014 0 0 0 19.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 0 0-4.512 1.074l-1.78-1.781zm4.261 4.26 1.514 1.515a2.003 2.003 0 0 1 2.45 2.45l1.514 1.514a4 4 0 0 0-5.478-5.478z" clipRule="evenodd" />
      <path d="M12.454 16.697 9.75 13.992a4 4 0 0 1-3.742-3.741L2.335 6.578A9.98 9.98 0 0 0 .458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
    </svg>
  );
}

/**
 * Field — underline-only form input pattern from the design system.
 *
 * Marketing surfaces use this style exclusively (no boxed inputs).
 * Boxed inputs are reserved for the newsletter and admin panels and use a
 * separate component (not yet implemented).
 */

interface BaseFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | undefined;
  /** Render label visually but keep it accessible. Use sparingly. */
  hideLabel?: boolean;
  className?: string;
  children?: ReactNode;
}

const baseInput = [
  "w-full rounded-none border-0 border-b border-neutral-300 bg-transparent",
  "px-0 pb-2.5 pt-1 text-base text-neutral-900",
  "transition-colors duration-base ease-brand",
  "focus:border-b-2 focus:border-orange-500 focus:outline-none",
  "disabled:cursor-not-allowed disabled:text-neutral-500",
  "aria-[invalid=true]:border-semantic-danger",
].join(" ");

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "required">,
    BaseFieldProps {}

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, required, hint, error, hideLabel, className, type, ...rest },
  ref,
) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={cn("mb-6", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-2 block font-sans text-sm font-medium text-neutral-700",
          hideLabel && "sr-only",
        )}
      >
        {label}
        {required ? <span className="ml-0.5 text-orange-600">*</span> : null}
      </label>
      <div className={cn(isPassword && "relative")}>
        <input
          ref={ref}
          id={id}
          type={isPassword ? (revealed ? "text" : "password") : type}
          aria-invalid={Boolean(error)}
          aria-required={required}
          aria-describedby={describedBy}
          className={cn(baseInput, isPassword && "pr-8")}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={revealed ? "Hide password" : "Show password"}
            onClick={() => setRevealed((v) => !v)}
            tabIndex={-1}
            className="absolute bottom-2 right-0 text-neutral-400 hover:text-neutral-700 focus:outline-none"
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 font-sans text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 font-sans text-xs text-semantic-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});

interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "required">,
    BaseFieldProps {}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaProps>(function TextareaField(
  { label, required, hint, error, hideLabel, className, rows = 4, ...rest },
  ref,
) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("mb-6", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-2 block font-sans text-sm font-medium text-neutral-700",
          hideLabel && "sr-only",
        )}
      >
        {label}
        {required ? <span className="ml-0.5 text-orange-600">*</span> : null}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={describedBy}
        className={cn(baseInput, "resize-y leading-relaxed")}
        {...rest}
      />
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 font-sans text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 font-sans text-xs text-semantic-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "required">,
    BaseFieldProps {}

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField(
  { label, required, hint, error, hideLabel, className, children, ...rest },
  ref,
) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("mb-6", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-2 block font-sans text-sm font-medium text-neutral-700",
          hideLabel && "sr-only",
        )}
      >
        {label}
        {required ? <span className="ml-0.5 text-orange-600">*</span> : null}
      </label>
      <select
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={describedBy}
        className={baseInput}
        {...rest}
      >
        {children}
      </select>
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 font-sans text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 font-sans text-xs text-semantic-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
