import { siteUrl } from "@/lib/siteUrl";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const url = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/styleguide"] }],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  };
}
