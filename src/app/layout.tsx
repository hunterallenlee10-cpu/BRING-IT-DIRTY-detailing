import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import { siteConfig, fill } from "@/site.config";
import { themeCss } from "@/lib/theme";
import { siteUrl } from "@/lib/siteUrl";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jbm = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbm", display: "swap", weight: ["400", "500", "700"] });


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: fill(siteConfig.seo.titlePattern),
  description: fill(siteConfig.seo.description),
  applicationName: `${siteConfig.brand.name} ${siteConfig.brand.suffix}`,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: `${siteConfig.brand.name} ${siteConfig.brand.suffix}`,
    title: fill(siteConfig.seo.titlePattern),
    description: fill(siteConfig.seo.description),
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: siteConfig.theme.bg,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${anton.variable} ${inter.variable} ${jbm.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
