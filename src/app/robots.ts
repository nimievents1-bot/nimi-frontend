import { type MetadataRoute } from "next";

import { clientEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.NODE_ENV === "production";
  return {
    rules: isProd
      ? [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] }]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${clientEnv.NEXT_PUBLIC_WEB_ORIGIN}/sitemap.xml`,
  };
}
