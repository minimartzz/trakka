import { UserProvider } from "@/components/UserProvider";
import fetchUser from "@/utils/fetchServerUser";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// Server-side gate for the session routes. These pages previously relied on the
// client-side useAuth hook, which only redirects after hydration — the markup
// was already sent by then. Checking here mirrors the account layout so
// anonymous visitors are redirected before any HTML is produced.
export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SessionLayoutFallback />}>
      <AuthenticatedSession>{children}</AuthenticatedSession>
    </Suspense>
  );
}

function SessionLayoutFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Reading the user is uncached, so it stays inside the Suspense boundary above:
// with cacheComponents enabled, awaiting it at the top level would block the
// whole route from rendering.
async function AuthenticatedSession({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await fetchUser();
  if (!user) {
    redirect("/login");
  }

  return <UserProvider user={user}>{children}</UserProvider>;
}