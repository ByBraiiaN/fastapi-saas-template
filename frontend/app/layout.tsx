import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Orbit — Operations and analytics in one dashboard",
    template: "%s · Orbit",
  },
  description:
    "Orbit is a complete SaaS template for streamlining operations and turning data into decisions. Next.js, FastAPI, and Paddle included.",
  applicationName: "Orbit",
  authors: [{ name: "Orbit" }],
  keywords: ["SaaS", "template", "Next.js", "FastAPI", "Paddle", "analytics", "operations"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Orbit",
    title: "Orbit — Your operation, finally in orbit",
    description:
      "Metrics, alerts, and team workflows in a dashboard you can read at a glance. A SaaS template with auth, plans, and billing ready to go.",
  },
  twitter: {
    card: "summary",
    title: "Orbit — Your operation, finally in orbit",
    description:
      "SaaS template with landing page, auth, dashboard, admin, and Paddle billing. Adapt it to your product.",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
