import { type MetadataRoute } from "next";

import { clientEnv } from "@/lib/env";

const PUBLIC_ROUTES = ["/", "/catering", "/events", "/gifting", "/cravings", "/about", "/faq"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = clientEnv.NEXT_PUBLIC_WEB_ORIGIN;
  return PUBLIC_ROUTES.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
