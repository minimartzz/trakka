"use client";

import Image from "next/image";
import Link from "next/link";
import logoDark from "@/public/trakka_logo_dark.png";
import { useEffect, useState } from "react";

// Year is resolved client-side: Cache Components forbids `new Date()` during
// prerender, so the static fallback ships and the client corrects it if needed.
const Year = () => {
  const [year, setYear] = useState(2026);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <>{year}</>;
};

const LandingFooter = () => (
  <footer className="border-t border-border">
    <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row">
      <div className="flex items-center gap-3">
        <Image src={logoDark} alt="Trakka logo" height={28} width={28} />
        <span className="text-sm text-muted-foreground">
          © <Year /> Trakka
        </span>
      </div>
      <nav className="flex items-center gap-6 text-sm text-muted-foreground">
        <Link href="/faq" className="transition-colors hover:text-foreground">
          FAQ
        </Link>
        <Link
          href="https://github.com/minimartzz/trakka/blob/main/CHANGELOG.md"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
        >
          Changelog
        </Link>
      </nav>
      <Image
        src="/bgg/powered-by-bgg-reversed-rgb.svg"
        alt="Powered by BoardGameGeek"
        width={140}
        height={37}
      />
    </div>
  </footer>
);

export default LandingFooter;
