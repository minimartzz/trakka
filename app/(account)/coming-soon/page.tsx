import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hammer } from "lucide-react";
import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4 text-center">
      <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
        <Hammer className="h-3 w-3" />
        Coming soon
      </Badge>
      <p className="text-muted-foreground">
        Public tribe and game pages are on the way.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
