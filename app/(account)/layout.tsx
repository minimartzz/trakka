import { AppSidebar } from "@/components/app-sidebar";
import Feedback from "@/components/Feedback";
import Footer from "@/components/Footer";
import GlobalSearchBar from "@/components/GlobalSearchBar";
import ShareButton from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { groupTable } from "@/db/schema/group";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import fetchUser from "@/utils/fetchServerUser";
import { eq } from "drizzle-orm";
import { Play } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For persisted state in sidebar
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  // Get user details
  const user = await fetchUser();
  if (!user) {
    redirect("/login");
  }

  // Get user's groups directly from DB
  const groupRows = await db
    .select({ profile_group: profileGroupTable, group: groupTable })
    .from(profileGroupTable)
    .leftJoin(groupTable, eq(profileGroupTable.groupId, groupTable.id))
    .where(eq(profileGroupTable.profileId, user.id));
  const groups = groupRows
    .filter((item) => item.group !== null)
    .map((item) => ({
      ...item.profile_group,
      ...item.group,
      id: String(item.group!.id),
      name: item.group!.name ?? "",
      image: item.group!.image ?? "",
    }));

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        user={{
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          email: user.email,
          avatar: user.image,
        }}
        tribes={groups}
      />
      <SidebarInset>
        <header className="flex h-20 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
          <div className="flex items-center gap-2 sm:gap-10 px-4">
            <SidebarTrigger className="-ml-1" />
            <GlobalSearchBar />
          </div>
          <div className="flex gap-x-4 items-center justify-center">
            <ShareButton userId={user.id} tribes={groups} />
            <Button
              className="rounded-full h-12 w-12 sm:h-10 sm:w-auto px-2 mr-10 bg-[#1e4790] hover:bg-primary"
              asChild
            >
              <Link href="/session/create">
                <Play className="text-white fill-white" />
                <span className="hidden sm:block font-semibold text-[16px] text-white">
                  New Session
                </span>
              </Link>
            </Button>
          </div>
        </header>
        {children}
        <div className="flex justify-end-safe">
          <div className="fixed bottom-5 right-4 z-10">
            <Feedback profileId={user.id} />
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
