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
import { BarChart3, ChevronDown, Crown, Plus, Search } from "lucide-react";
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

// Menu items
const items = {
  // TODO: User info & Tribes
  user: {
    name: "jlee",
    email: "johnlee@gmail.com",
    avatar:
      "https://cf.geekdo-images.com/-A_ABjMw4PdoAZrH-FjiiA__itemrep/img/jAfHCmAqiY2pdq-SvbhgJDxoqIc=/fit-in/246x300/filters:strip_icc()/pic5726930.png",
  },
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
  tribe: [
    {
      id: "a16cb5c8-8272-4fef-bf8d-5c0a532ce22d",
      name: "hillview",
      icon: "https://cf.geekdo-images.com/wW5xjgBJcFyLaEWZwrYuKA__itemrep/img/3QLqMVpqfJ9IeVBnJVCE06T3Zhk=/fit-in/246x300/filters:strip_icc()/pic4583626.jpg",
    },
    {
      id: "d22e291e-9040-4f77-8fc0-fe86793fad40",
      name: "aalto",
      icon: "https://cf.geekdo-images.com/wW5xjgBJcFyLaEWZwrYuKA__itemrep/img/3QLqMVpqfJ9IeVBnJVCE06T3Zhk=/fit-in/246x300/filters:strip_icc()/pic4583626.jpg",
    },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const isCollapsed = sidebar.state === "collapsed";
  const [isTribesOpen, setIsTribesOpen] = useState<boolean>(true);

  useEffect(() => {
    console.log(pathname);
  }, [pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        {/* Header Logo */}
        {isCollapsed ? (
          <SidebarMenuButton size="lg" className="ml-2" asChild>
            <a href={"/dashboard"}>
              <Image src={Logo} alt="logo" width={30} />
            </a>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton asChild>
            <a href={"/dashboard"}>
              <Image src={Logo} alt="logo" height={35} />
              <span className="font-asimovian text-2xl">TRAKKA</span>
            </a>
          </SidebarMenuButton>
        )}
        <SidebarSeparator className="bg-sidebar-accent mx-0" />

        {/* Search Bar */}
        {!isCollapsed && (
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
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="hover:text-slate-300 cursor-pointer flex items-center justify-between py-2">
                <span className="text-xs font-medium uppercase tracking-wide">
                  {isCollapsed ? "T" : "TRIBES"}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-slate-700"
                    // TODO: Function for onClick to create new tribes
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${
                      isTribesOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </div>
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent
              className={cn(
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
              )}
            >
              {items.tribe.map((item) => (
                <SidebarMenuItem className="pt-1" key={item.id}>
                  <SidebarMenuButton
                    className={
                      pathname === `/tribe/${item.id}` ? "bg-slate-700" : ""
                    }
                    asChild
                  >
                    <a href={`/tribe/${item.id}`}>
                      <Image
                        src={item.icon}
                        alt="Group Icon"
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
