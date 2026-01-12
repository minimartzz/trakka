"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { BarChart3, ChevronDown, Crown, Search } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Logo from "@/public/trakka_logo.png";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import SidebarUser from "@/components/SidebarUser";
import NewGroup from "@/components/NewGroup";
import RequestInbox from "@/components/tribes/RequestInbox";

interface AppSidebarProps {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatar: string;
  };
  tribes: {
    id: string;
    name: string;
    image: string;
  }[];
}

// Menu items
const items = {
  personal: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
    },
    {
      name: "Recent Games",
      url: "/recent-games",
      icon: Crown,
    },
  ],
};

export function AppSidebar({ user, tribes }: AppSidebarProps) {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const isCollapsed = sidebar.state === "collapsed";
  const showCollapsedView = isCollapsed && !sidebar.isMobile;
  const [isTribesOpen, setIsTribesOpen] = useState<boolean>(true);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent className="overflow-x-hidden">
        {/* Header Logo */}
        {showCollapsedView ? (
          <SidebarMenuButton size="lg" className="ml-2" asChild>
            <a href={"/dashboard"}>
              <Image src={Logo} alt="logo" width={30} />
              <span className="font-asimovian text-2xl">TRAKKA</span>
              <div>
                <RequestInbox profileId={user.id} />
              </div>
            </a>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton asChild>
            <div className="flex items-center justify-between hover:bg-transparent">
              <a href={"/dashboard"} className="flex items-center gap-x-2">
                <Image src={Logo} alt="logo" height={35} />
                <span className="font-asimovian text-2xl">TRAKKA</span>
              </a>
              <div>
                <RequestInbox profileId={user.id} />
              </div>
            </div>
          </SidebarMenuButton>
        )}
        <SidebarSeparator className="bg-sidebar-accent mx-0" />

        {/* Search Bar */}
        {!showCollapsedView && (
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search"
                className="pl-10 bg-slate-900 border-slate-600 text-slate-300 placeholder-slate-400"
              />
            </div>
          </div>
        )}

        {/* Performance */}
        <SidebarGroup>
          <SidebarGroupLabel>MY PERFORMANCE</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.personal.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    className={pathname === item.url ? "bg-slate-700" : ""}
                    asChild
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tribes */}
        <SidebarGroup>
          <Collapsible open={isTribesOpen} onOpenChange={setIsTribesOpen}>
            <SidebarGroupLabel className="hover:text-slate-300 cursor-pointer flex items-center justify-between py-2">
              <span className="text-xs font-medium uppercase tracking-wide">
                TRIBES
              </span>
              <div className="flex items-center gap-1">
                <NewGroup user={user} className="hover:bg-slate-700" />
                {/* </Button> */}
                <CollapsibleTrigger asChild>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${
                      isTribesOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </CollapsibleTrigger>
              </div>
            </SidebarGroupLabel>
            <CollapsibleContent
              className={cn(
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
              )}
            >
              {tribes.map((item) => (
                <SidebarMenuItem className="pt-1" key={item.id}>
                  <SidebarMenuButton
                    className={
                      pathname === `/tribe/${item.id}` ? "bg-slate-700" : ""
                    }
                    asChild
                  >
                    <a href={`/tribe/${item.id}`}>
                      <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={item.image}
                          alt="Group Icon"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Add tribes button when sidebar closed */}
          {showCollapsedView && (
            <Button
              className="flex mt-3 w-8 h-8 p-0 rounded-full justify-center"
              variant="outline"
              asChild
            >
              <NewGroup user={user} />
            </Button>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
