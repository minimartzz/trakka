import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Play } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For persisted state in sidebar
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-20 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-lora font-semibold">
            Welcome back, John
            {/* TODO: Make this Dynamic */}
          </h2>
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
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
