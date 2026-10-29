import type { Metadata } from "next";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: { default: `${siteConfig.brand.name} · Studio OS`, template: `%s · ${siteConfig.brand.name} Studio OS` },
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="admin min-h-dvh bg-bg text-text">{children}</div>;
}
