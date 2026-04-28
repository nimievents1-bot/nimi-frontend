import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from "react";

import { cn } from "@/lib/cn";

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
  { label, required, hint, error, hideLabel, className, ...rest },
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
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={describedBy}
        className={baseInput}
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
