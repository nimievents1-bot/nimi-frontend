"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import {
  TextField,
  TextareaField,
} from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

const Schema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Lowercase letters, numbers and hyphens only."),
  title: z.string().min(2).max(200),
  excerpt: z.string().min(20).max(400),
  authorName: z.string().min(2).max(120),
  category: z.string().max(80).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof Schema>;

export function NewPostForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { authorName: "Nimi Events" },
  });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      const post = await apiFetch<{ id: string }>("/admin/blog/posts", {
        method: "POST",
        body: {
          slug: values.slug,
          title: values.title,
          excerpt: values.excerpt,
          // Seed body — the editor will replace this.
          body: "<p>Write your post here.</p>",
          authorName: values.authorName,
          category: values.category || undefined,
        },
      });
      router.push(`/admin/blog/${post.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to create post.");
    }
  });

  return (
    <form noValidate onSubmit={submit} className="max-w-xl">
      {error ? (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <TextField
        label="Slug"
        required
        hint="The URL path under /journal. Lowercase, hyphens. Hard to change later — pick well."
        error={errors.slug?.message}
        {...register("slug")}
      />
      <TextField label="Title" required error={errors.title?.message} {...register("title")} />
      <TextareaField
        label="Excerpt"
        rows={3}
        required
        hint="Two or three sentences. Shown on the journal index and used as fallback meta description."
        error={errors.excerpt?.message}
        {...register("excerpt")}
      />
      <TextField
        label="Author"
        required
        error={errors.authorName?.message}
        {...register("authorName")}
      />
      <TextField
        label="Category"
        hint="e.g. Behind the kitchen, Gifting, Cravings."
        error={errors.category?.message}
        {...register("category")}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create draft"}
      </Button>
    </form>
  );
}
