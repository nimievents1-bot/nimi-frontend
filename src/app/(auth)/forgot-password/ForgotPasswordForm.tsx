"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { apiFetch } from "@/lib/api";

const Schema = z.object({
  email: z.string().email("Please enter a valid email address."),
});
type FormValues = z.infer<typeof Schema>;

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(Schema) });

  const submit = handleSubmit(async (values) => {
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: values });
    } catch {
      // Anti-enumeration: always show the same success state.
    }
    setDone(true);
  });

  if (done) {
    return (
      <Alert variant="success">
        If we have an account for that email, you&rsquo;ll receive a reset link in a few minutes.
        It expires in 15 minutes — open it on the same device for best results.
      </Alert>
    );
  }

  return (
    <form noValidate onSubmit={submit}>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" block disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
