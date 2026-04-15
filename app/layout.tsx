import type { Metadata } from "next";
import {
  Barlow_Condensed,
  Barlow,
  Figtree,
  Geist_Mono,
} from "next/font/google";
import "./globals.css";
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
  title: "Trakka",
  description: "Game intelligence for board game enthusiasts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
