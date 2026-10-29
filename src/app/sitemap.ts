import { siteUrl } from "@/lib/siteUrl";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = siteUrl();
  return [{ url: `${url}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}
