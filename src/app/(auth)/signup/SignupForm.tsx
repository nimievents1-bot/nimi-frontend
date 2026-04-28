"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Mirrors the API's RegisterDto — keep in sync. The same regex enforces
 * structural password complexity; the API does the same on the server.
 */
const PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

const Schema = z
  .object({
    name: z.string().min(2, "Please enter your name.").max(120),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().max(32).optional().or(z.literal("")),
    password: z.string().regex(PASSWORD, {
      message:
        "Password must be 12+ chars with lower, upper, number and a special character.",
    }),
    confirm: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "Please accept the terms to continue." }),
    }),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match.",
  });

type FormValues = z.infer<typeof Schema>;

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(Schema) });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: {
          name: values.name,
          email: values.email,
          password: values.password,
          ...(values.phone ? { phone: values.phone } : {}),
        },
      });
      router.push("/account?status=welcome");
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.detail : "Something went wrong. Please try again.",
      );
    }
  });

  return (
    <form noValidate onSubmit={submit}>
      {serverError ? (
        <Alert variant="danger" className="mb-4">
          {serverError}
        </Alert>
      ) : null}

      <TextField label="Name" autoComplete="name" required error={errors.name?.message} {...register("name")} />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField label="Phone (optional)" type="tel" autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        hint="12+ characters with lowercase, uppercase, number and a special character."
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        error={errors.confirm?.message}
        {...register("confirm")}
      />
      <label className="mb-6 flex items-start gap-2 font-sans text-sm text-neutral-700">
        <input
          type="checkbox"
          className="mt-1 h-[18px] w-[18px] cursor-pointer appearance-none border-[1.5px] border-neutral-400 bg-cream-50 checked:border-maroon-600 checked:bg-maroon-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          {...register("acceptedTerms")}
        />
        <span>
          I agree to the{" "}
          <a href="/terms" className="text-orange-600 underline underline-offset-4">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-orange-600 underline underline-offset-4">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {errors.acceptedTerms ? (
        <p role="alert" className="-mt-4 mb-4 font-sans text-xs text-semantic-danger">
          {errors.acceptedTerms.message}
        </p>
      ) : null}

      <Button type="submit" block disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
