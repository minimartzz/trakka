import type { Metadata } from "next";
import {
  Barlow_Condensed,
  Barlow,
  Figtree,
  Geist_Mono,
} from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";

// Display font — sports broadcast energy, condensed standings/headings
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Heading/body-alt font — readable at data-dense sizes
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Body font — humanist, community-warm, highly readable
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Monospace — code, session IDs
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Trakka — Board Game Tracker & Stats for Your Group",
    // Page-level titles render as "Recent Games · Trakka"
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "Trakka — Board Game Tracker & Stats for Your Group",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Trakka — Board Game Tracker & Stats for Your Group",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/trakka_logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      // Free product — this matches the "Free to use" claim on the hero.
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Site-wide entity graph: brand identity + app classification. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
      </head>
      <body
        className={`${figtree.variable} ${barlowCondensed.variable} ${barlow.variable} ${geistMono.variable} font-body antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextTopLoader color="#3156a2" height={5} showSpinner={false} />
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
