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
import { BarChart3, Crown, Search } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Logo from "@/public/trakka_logo.png";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
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
  tribeId: string,
): number => {
  const filteredRequests = allRequests.filter(
    (req) => req.data.group_id === tribeId,
  );

  return filteredRequests.length;
};

export function AppSidebar({ user, tribes }: AppSidebarProps) {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const isCollapsed = sidebar.state === "collapsed";
  const showCollapsedView = isCollapsed && !sidebar.isMobile;
  const [requests, setRequests] = useState<TribeRequest[]>([]);
  const [tribeSearch, setTribeSearch] = useState<string>("");

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
          <SidebarGroupLabel className="flex items-center justify-between py-2">
            <span className="text-xs font-medium uppercase tracking-wide">
              TRIBES
            </span>
            <NewGroup
              user={user}
              className="flex items-center justify-center h-6 w-6 rounded-md border border-primary text-primary text-sm font-medium py-2 hover:bg-primary/10 transition-colors cursor-pointer"
            />
          </SidebarGroupLabel>

          {/* Search */}
          {!showCollapsedView && (
            <div className="px-2 pb-2 mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search Tribes"
                  className="pl-10 bg-slate-900 border-slate-600 text-slate-300 placeholder-slate-400"
                  value={tribeSearch}
                  onChange={(e) => setTribeSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          {tribes
            .filter((item) =>
              item.name.toLowerCase().includes(tribeSearch.toLowerCase()),
            )
            .map((item) => (
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
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      {showCollapsedView &&
                        numTribeRequests(requests, item.id) > 0 && (
                          <span className="absolute bottom-5 -right-1 flex h-2.5 w-2.5 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                          </span>
                        )}
                      <span>{item.name}</span>
                    </div>
                    {!showCollapsedView && numTribeRequests(requests, item.id) > 0 && (
                      <span className="flex h-2.5 w-2.5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                      </span>
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

          {/* Create Tribe button at bottom */}
          {!showCollapsedView && (
            <div className="px-2 pt-2">
              <NewGroup
                user={user}
                label="Create Tribe"
                className="w-full flex items-center justify-center gap-2 rounded-md border border-primary text-primary text-sm font-medium py-2 hover:bg-primary/10 transition-colors cursor-pointer"
              />
            </div>
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
