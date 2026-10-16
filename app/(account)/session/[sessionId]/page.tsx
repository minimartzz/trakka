import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import NoTribeAccess from "@/components/NoTribeAccess";
import CompetitiveResults from "@/components/session/CompetitiveResults";
import {
  GameBand,
  GameDetailsExpander,
  GameRail,
} from "@/components/session/GameBox";
import SessionHeader from "@/components/session/SessionHeader";
import { CoopResults, SoloResults } from "@/components/session/OutcomeResults";
import SessionDescription from "@/components/session/SessionDescription";
import fetchUser from "@/utils/fetchServerUser";
import { getSessionPage, getSessionTitle } from "./data";
import SessionLoading from "./loading";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const user = await fetchUser();
  const title = user ? await getSessionTitle(sessionId, user.id) : null;
  return { title: title ?? "Session", robots: { index: false } };
}

const SessionContent = async ({ params }: PageProps) => {
  const { sessionId } = await params;
  // The account layout has already sent logged-out visitors to login
  const user = await fetchUser();
  if (!user) notFound();

  const result = await getSessionPage(sessionId, user.id);
  if (result.kind === "not-found") notFound();
  if (result.kind === "no-access") {
    return (
      <NoTribeAccess
        tribe={result.tribe}
        requestPending={result.requestPending}
        subject="This session"
      />
    );
  }

  const { data } = result;
  return (
    <div className="p-4 pb-16 sm:p-8">
      <SessionHeader data={data} />

      <div className="mt-6 flex gap-8">
        <GameRail data={data} className="hidden xl:block" />

        <div className="min-w-0 flex-1 space-y-8">
          <GameBand data={data} className="xl:hidden" />

          {data.mode === "coop" ? (
            <CoopResults data={data} viewerId={user.id} />
          ) : data.mode === "solo" ? (
            <SoloResults data={data} viewerId={user.id} />
          ) : (
            <>
              <CompetitiveResults data={data} viewerId={user.id} />
              {data.description && (
                <SessionDescription description={data.description} />
              )}
            </>
          )}

          <GameDetailsExpander data={data} className="md:hidden" />
        </div>
      </div>
    </div>
  );
};

const Page = ({ params }: PageProps) => (
  <Suspense fallback={<SessionLoading />}>
    <SessionContent params={params} />
  </Suspense>
);

export default Page;
