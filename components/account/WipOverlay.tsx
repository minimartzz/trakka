import { Badge } from "@/components/ui/badge";
import { Hammer } from "lucide-react";
import React from "react";

interface WipOverlayProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a section that has no real data or logic yet. The section's
 * eventual shape stays visible underneath a scrim so it teaches the
 * interface instead of showing a blank "nothing here" state, but is
 * fully inert: no pointer events, out of the tab order.
 */
const WipOverlay = ({ children, className }: WipOverlayProps) => {
  return (
    <div className={`relative overflow-hidden rounded-lg ${className ?? ""}`}>
      <div aria-hidden="true" className="pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/70">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
          <Hammer className="h-3 w-3" />
          Coming soon
        </Badge>
      </div>
    </div>
  );
};

export default WipOverlay;
