import { AppSidebar } from "@/components/app-sidebar";
import Feedback from "@/components/Feedback";
import ShareButton from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SelectGroup } from "@/db/schema/group";
import { SelectProfileGroup } from "@/db/schema/profileGroup";
import fetchUser from "@/utils/fetchServerUser";
import { Play } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

interface ProfileGroups {
  profile_group: SelectProfileGroup;
  group: SelectGroup;
}
const baseUrl = process.env.BASE_URL;

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

  // Get users groups
  const response = await fetch(`${baseUrl}/api/group?profileId=${user.id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch groups: ${response.statusText}`);
  }
  const out = await response.json();
  const groups = out.map((item: ProfileGroups) => {
    return {
      ...item.profile_group,
      ...item.group,
    };
  });

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
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-lora font-semibold">
            {`Welcome back, ${user.first_name}`}
          </h2>
          <div className="flex gap-x-4 items-center justify-center">
            <ShareButton userId={user.id} tribes={groups} />
            <Button
              className="rounded-full h-12 w-12 sm:h-12 sm:w-auto px-2 mr-10"
              asChild
            >
              <Link href="/session/create">
                <Play className="text-white" />
                <span className="hidden sm:block font-semibold text-[16px] text-white">
                  New Session
                </span>
              </Link>
            </Button>
          </div>
        </header>
        {children}
        <footer>
          <div className="flex justify-end-safe">
            <div className="fixed bottom-5 right-4 z-10">
              <Feedback profileId={user.id} />
            </div>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
