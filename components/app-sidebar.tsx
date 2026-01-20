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
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import SidebarUser from "@/components/SidebarUser";
import NewGroup from "@/components/NewGroup";
import ActivityLog from "@/components/ActivityLog";
import { getAllTribeRequests } from "@/components/actions/tribeRequests";
import { TribeRequest } from "@/lib/interfaces";

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

// Functions
const numTribeRequests = (
  allRequests: TribeRequest[],
  tribeId: string
): number => {
  const filteredRequests = allRequests.filter(
    (req) => req.data.group_id === tribeId
  );

  return filteredRequests.length;
};

export function AppSidebar({ user, tribes }: AppSidebarProps) {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const isCollapsed = sidebar.state === "collapsed";
  const showCollapsedView = isCollapsed && !sidebar.isMobile;
  const [isTribesOpen, setIsTribesOpen] = useState<boolean>(true);
  const [requests, setRequests] = useState<TribeRequest[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const results = await getAllTribeRequests(user.id);

      if (results) {
        setRequests(results as unknown as TribeRequest[]);
      }
    };

    fetchRequests();
  }, []);

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
                <ActivityLog profileId={user.id} />
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
                <ActivityLog profileId={user.id} />
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
                    <a
                      href={`/tribe/${item.id}`}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                          <Image
                            src={item.image}
                            alt="Group Icon"
                            fill
                            className="object-cover"
                          />
                        </div>
                        {isCollapsed &&
                          numTribeRequests(requests, item.id) > 0 && (
                            <span className="absolute bottom-5 -right-1 flex h-2.5 w-2.5 items-center justify-center">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                            </span>
                          )}
                        <span>{item.name}</span>
                      </div>
                      {numTribeRequests(requests, item.id) > 0 && (
                        <span className="flex h-2.5 w-2.5 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-destructive opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                        </span>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Add tribes button when sidebar closed */}
          {showCollapsedView && (
            <Button
              className="flex mt-3 w-8 h-8 p-0 rounded-full justify-center bg-sidebar-accent border-sidebar"
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
