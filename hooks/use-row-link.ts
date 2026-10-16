"use client";

import { useRouter } from "nextjs-toploader/app";

// Controls inside a row that do their own thing when clicked
const INTERACTIVE =
  "a, button, input, select, textarea, label, [role='button'], [role='checkbox']";

export const sessionHref = (sessionId: string) => `/session/${sessionId}`;

/**
 * Lets a whole row or card open a page on click while the links and buttons
 * inside it keep working. Pair it with a real <Link> in the row, so keyboard
 * users can reach the page and it can be opened in a new tab.
 */
export function useRowLink() {
  const router = useRouter();

  return (href: string) => (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    // React bubbles clicks out of portals (tooltips, menus) through the row
    if (!event.currentTarget.contains(target)) return;
    const control = target.closest(INTERACTIVE);
    if (control && event.currentTarget.contains(control)) return;
    // Selecting text isn't a click through
    if (window.getSelection()?.toString()) return;

    if (event.metaKey || event.ctrlKey) {
      window.open(href, "_blank", "noopener");
    } else {
      router.push(href);
    }
  };
}
