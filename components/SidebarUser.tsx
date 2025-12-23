"use client";
import React, { useEffect, useState } from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import Image from "next/image";
import {
  ChevronsUpDown,
  HelpCircle,
  LogOut,
  Moon,
  RefreshCcw,
  Settings,
  Share2,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ShareInterface {
  title: string;
  text: string;
  url: string;
}

const SidebarUser = ({
  user,
}: {
  user: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatar: string;
  };
}) => {
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Share Button
  const handleShare = async ({ title, text, url }: ShareInterface) => {
    // Checks if browser is Web Share API compatible
    if (!navigator.share) {
      console.warn(
        "Web Share API not supported in this browser. Copying URL instead."
      );

      try {
        await navigator.clipboard.writeText(url);
        toast.info("Share Unavailable", {
          description: "URL copied to clipboard",
        });
      } catch (error) {
        toast.error("Share Unavailable", {
          description: "Failed to copy URL to clipboard",
        });
      }
      return;
    }

    const shareData: ShareData = {
      title,
      text,
      url,
    };

    try {
      await navigator.share(shareData);
      console.log("Content successfully shared");
    } catch (error) {
      if ((error as Error).name != "AbortError") {
        console.error("Error sharing content", error);
        toast.error("Sharing Failed", {
          description: "An unexpected error occurred while trying to share",
        });
      }
    }
  };

  const menuItems = [
    { icon: User, label: "Account", action: () => router.push("/account") },
    { icon: HelpCircle, label: "Help", action: () => console.log("Help") },
    {
      icon: RefreshCcw,
      label: "Sync with BoardGameGeek",
      action: () => console.log("Sync"),
    },
    {
      icon: Settings,
      label: "Settings",
      action: () => console.log("Settings"),
    },
  ];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Profile Picture */}
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.avatar}
                  alt={user.username}
                  className="object-cover w-full h-full"
                />
                <AvatarFallback className="rounded-lg">
                  <Image
                    src="/missing_icon.png"
                    alt="Missing User"
                    width={8}
                    height={8}
                  />
                </AvatarFallback>
              </Avatar>

              {/* Username and Email */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="pb-0.5">
                  <span className="truncate font-medium">{`${user.firstName} ${user.lastName}`}</span>
                  <span className="truncate font-sm text-gray-500">{`   (@${user.username})`}</span>
                </div>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* Menu Details */}
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.avatar}
                    alt={user.username}
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="rounded-lg">
                    <Image
                      src="/missing_icon.png"
                      alt="Missing User"
                      width={8}
                      height={8}
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="pb-0.5">
                    <span className="truncate font-medium">{`${user.firstName} ${user.lastName}`}</span>
                    <span className="truncate font-sm text-gray-500">{`   (@${user.username})`}</span>
                  </div>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* List of Menu Items */}
            {menuItems.map((item) => (
              <DropdownMenuGroup key={item.label}>
                <DropdownMenuItem
                  key={item.label}
                  className="mt-0.5"
                  onClick={item.action}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            ))}
            {/* Item to toggle theme */}
            <DropdownMenuGroup key="toggle-theme">
              <DropdownMenuItem
                className="mt-0.5"
                key="toggle-theme"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {theme === "dark" ? "Toggle Light Mode" : "Toggle Dark Mode"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {/* Refer a friend */}
            <DropdownMenuGroup key="refer">
              <DropdownMenuItem
                className="mt-0.5"
                key="refer"
                onClick={() =>
                  handleShare({
                    title: "Welcome to Trakka",
                    text: "Sign up for a free Traaka account",
                    url: "https://trakka.co/login?tab=sign-up",
                  })
                }
              >
                <Share2 className="h-4 w-4" />
                Refer a Friend
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Sign Out */}
            <DropdownMenuGroup key="sign-out">
              <form action="/auth/signout" method="post">
                <DropdownMenuItem key="sign-out" asChild>
                  <button
                    type="submit"
                    className="w-full hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 text-destructive" />
                    <p className="text-destructive">Sign Out</p>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default SidebarUser;
