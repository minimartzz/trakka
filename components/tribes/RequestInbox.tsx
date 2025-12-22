"use client";
import { handleRequestAction } from "@/app/(generic)/join/[code]/action";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import createClient from "@/utils/supabase/client";
import { Bell, Check, User, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

const RequestInbox = ({ profileId }: { profileId: number }) => {
  const supabase = createClient();
  const [requests, setRequests] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleAction = (
    groupId: string,
    profileId: number,
    type: "accept" | "reject"
  ) => {
    startTransition(async () => {
      const result = await handleRequestAction(groupId, profileId, type);

      if (result.success) {
        toast.success(
          type === "accept" ? "User accepted!" : "Request rejected"
        );
      } else {
        toast.error(result.message || "Something went wrong");
      }
    });
  };

  useEffect(() => {
    const fetchRequests = async () => {
      // Get the original set of requests
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          id,
          created_at,
          data
        `
        )
        .eq("profile_id", profileId)
        .eq("type", "join_request")
        .eq("is_read", false)
        .order("created_at");

      if (error) {
        console.error("Supabase Error:", error.message, error.details);
        toast.error("Failed to fetch notifications");
        return;
      }

      if (data) setRequests(data);
    };

    fetchRequests();

    // Subscribe for updating requests
    const channel = supabase
      .channel("tribe-requests")
      .on(
        "postgres_changes",
        {
          schema: "public",
          table: "notifications",
          event: "*",
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) => {
          console.log("Realtime payload received:", payload);
          if (payload.eventType === "INSERT") {
            fetchRequests();
          }
          if (payload.eventType === "UPDATE") {
            if (payload.new.is_read === true) {
              setRequests((prevRequests) =>
                prevRequests.filter((req) => req.id !== payload.new.id)
              );
            } else {
              fetchRequests();
            }
          }
          if (payload.eventType === "DELETE") {
            setRequests((prevRequests) =>
              prevRequests.filter((req) => req.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, supabase]);

  return (
    // TODO: Update the UI
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Bell className="h-6 w-5" />
          {requests.length > 0 && (
            <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-semibold">
              {requests.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 pl-3 font-semibold border-b text-sm">
          Tribe Requests
        </div>
        <div className="max-h-80 overflow-y-auto">
          {requests.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No pending requests
            </p>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-4 border-b last:border-0 last:rounded-b-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
                    {req.data.requester.image ? (
                      <Image
                        src={req.data.requester.image}
                        alt="Profile Picture"
                        className="h-full w-full object-cover"
                        width={40}
                        height={40}
                      />
                    ) : (
                      <User className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-none">
                      {req.data.requester.first_name}{" "}
                      {req.data.requester.last_name}{" "}
                      <span className="text-xs text-gray-600">{`(${req.data.requester.username})`}</span>
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      wants to join{" "}
                      <b className="text-primary">{req.data.group_name}</b>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="default"
                    className="h-8 w-8 rounded-full dark:bg-background bg-slate-100 text-green-600 border-1 hover:bg-green-600 hover:text-white cursor-pointer z-10"
                    onClick={() =>
                      handleAction(
                        req.data.group_id,
                        req.data.requester_id,
                        "accept"
                      )
                    }
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="default"
                    className="h-8 w-8 rounded-full dark:bg-background bg-slate-100 text-destructive border-1 hover:bg-destructive hover:text-white cursor-pointer z-10"
                    onClick={() =>
                      handleAction(
                        req.data.group_id,
                        req.data.requester_id,
                        "reject"
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RequestInbox;
