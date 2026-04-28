import { type Metadata } from "next";

import { NewPostForm } from "./NewPostForm";

export const metadata: Metadata = {
  title: "Admin · New blog post",
  robots: { index: false, follow: false },
};

export default function NewPostPage() {
  return (
    <>
      <p className="eyebrow mb-2">Admin · Journal</p>
      <h1 className="m-0 mb-3 font-display text-4xl font-medium text-maroon-600">New post</h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Start with a slug, title and a short excerpt. You can flesh out the body and publish from
        the editor on the next page.
      </p>
      <NewPostForm />
    </>
  );
}
