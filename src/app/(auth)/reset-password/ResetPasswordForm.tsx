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

const PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

const Schema = z
  .object({
    password: z.string().regex(PASSWORD, {
      message:
        "Password must be 12+ chars with lower, upper, number and a special character.",
    }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match.",
  });

type FormValues = z.infer<typeof Schema>;

export function ResetPasswordForm({ token }: { token: string }) {
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
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: { token, password: values.password },
      });
      router.push("/login?status=reset");
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
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        hint="12+ characters with lowercase, uppercase, number and a special character."
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        error={errors.confirm?.message}
        {...register("confirm")}
      />
      <Button type="submit" block disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
