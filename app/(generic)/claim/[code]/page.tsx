/**
 * @page ClaimContent
 * @route `/claim/[code]
 *
 * @description "Landing" page for a shared claim link. Proxy stores the code
 * in pending_claim_code cookie. Old/ Invalid links are shown an invalid claim
 * link page.
 */
import LoadingSpinner from "@/components/icons/LoadingSpinner";
import RedirectButton from "@/components/RedirectButton";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { getAuthUser } from "@/utils/supabase/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const ClaimContent = async ({
  params,
}: {
  params: Promise<{ code: string }>;
}) => {
  const { code } = await params;

  const [anon] = await db
    .select({ id: profileTable.id })
    .from(profileTable)
    .where(
      and(eq(profileTable.claimCode, code), eq(profileTable.isAnonymous, true)),
    );

  if (!anon) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center">
          <h1 className="p-4 text-center text-4xl font-bold text-foreground">
            Invalid Claim Link
          </h1>
          <p className="text-center text-muted-foreground">
            This player has already been claimed, or the link is no longer
            valid. Check with your tribes SuperAdmin if this anonymous user is
            still valid.
          </p>
          <RedirectButton
            url="/dashboard"
            label="Return to Dashboard"
            loadLabel="Redirecting to dashboard ..."
            className="m-8"
          />
        </div>
      </div>
    );
  }

  const user = await getAuthUser();
  if (user) {
    redirect(`/account?tab=games&claim=${encodeURIComponent(code)}`);
  }

  // If user is logged out move them to login page. Cookie maintains state
  redirect("/login?reason=claim");
};

const Page = ({ params }: { params: Promise<{ code: string }> }) => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    }
  >
    <ClaimContent params={params} />
  </Suspense>
);

export default Page;
