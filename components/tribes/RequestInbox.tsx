"use client";
import React, { useMemo } from "react";
import { updateTribeRequests } from "../actions/tribeRequests";
import { respondToClaim } from "@/app/(account)/account/claim/action";
import { useNotifications } from "@/components/NotificationsProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { Check, Inbox, KeyRound, User, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { ClaimRequest, TribeRequest } from "@/lib/interfaces";
import posthog from "posthog-js";

const RequestInbox = ({
  tribeId,
  profileId: _profileId,
  tribeImageUrl,
}: {
  tribeId: string;
  profileId: number;
  tribeImageUrl: string;
}) => {
  const { notifications, setNotifications } = useNotifications();

  // Realtime + Initial pull
  // Filters only to join_request type notifications
  const requests = useMemo<TribeRequest[]>(
    () =>
      notifications.filter(
        (n) =>
          n.type === "join_request" &&
          !n.isRead &&
          (n.data as { group_id?: string }).group_id === tribeId,
      ) as unknown as TribeRequest[],
    [notifications, tribeId],
  );

  // Anonymous-user claim requests for this tribe (a distinct request kind).
  const claimRequests = useMemo<ClaimRequest[]>(
    () =>
      notifications.filter(
        (n) =>
          n.type === "claim_request" &&
          !n.isRead &&
          (n.data as { group_id?: string }).group_id === tribeId,
      ) as unknown as ClaimRequest[],
    [notifications, tribeId],
  );

  const totalCount = requests.length + claimRequests.length;

  const handleClaimAction = async (
    req: ClaimRequest,
    decision: "accept" | "reject",
  ) => {
    const result = await respondToClaim(
      req.data.anon_profile_id,
      req.data.group_id,
      req.data.claimer_id,
      decision,
    );

    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.type === "claim_request" &&
          (n.data as { anon_profile_id?: number }).anon_profile_id ===
            req.data.anon_profile_id
            ? { ...n, isRead: true }
            : n,
        ),
      );
      posthog.capture("anonymous_player_claim_resolved", {
        decision,
      });
      toast.success(result.message);
    } else {
      toast.error(result.message || "Something went wrong");
    }
  };

  const handleAction = async (
    tribeId: string,
    tribeName: string,
    tribeImageUrl: string,
    requesterId: number,
    status: string,
  ) => {
    const result = await updateTribeRequests(
      tribeId,
      tribeName,
      tribeImageUrl,
      requesterId,
      status,
    );

    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => {
          const d = n.data as {
            group_id?: string;
            requester_id?: number;
          };
          if (
            n.type === "join_request" &&
            d.group_id === tribeId &&
            d.requester_id === requesterId
          ) {
            return { ...n, isRead: true };
          }
          return n;
        }),
      );
      posthog.capture("tribe_join_request_resolved", {
        decision: status,
      });
      toast.success(result.message);
    } else {
      toast.error(result.message || "Something went wrong");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 sm:w-fit sm:px-4 sm:rounded-md rounded-full p-0 bg-accent-2/80 hover:bg-accent-2 dark:hover:bg-accent-2/60 hover:cursor-pointer"
        >
          <Inbox className="h-4! w-4!" />
          <span className="hidden sm:block">Inbox</span>
          {totalCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[12px] text-white font-semibold">
              {totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-2 pl-3 font-semibold border-b text-sm">
          Tribe Requests
        </div>
        <div
          className="max-h-80 overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {totalCount === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No pending requests
            </p>
          ) : (
            <>
              {requests.map((req) => (
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
                    className="h-8 w-8 rounded-full dark:bg-background bg-slate-100 text-green-600 border hover:bg-green-600 hover:text-white cursor-pointer z-10"
                    onClick={() =>
                      handleAction(
                        req.data.group_id,
                        req.data.group_name,
                        tribeImageUrl,
                        req.data.requester_id,
                        "accept",
                      )
                    }
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="default"
                    className="h-8 w-8 rounded-full dark:bg-background bg-slate-100 text-destructive border hover:bg-destructive hover:text-white cursor-pointer z-10"
                    onClick={() =>
                      handleAction(
                        req.data.group_id,
                        req.data.group_name,
                        tribeImageUrl,
                        req.data.requester_id,
                        "reject",
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              ))}

              {claimRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-4 border-b last:border-0 last:rounded-b-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
                      {req.data.claimer.image ? (
                        <Image
                          src={req.data.claimer.image}
                          alt="Profile Picture"
                          className="h-full w-full object-cover"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <KeyRound className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-none">
                        {req.data.claimer.first_name}{" "}
                        {req.data.claimer.last_name}{" "}
                        <span className="text-xs text-gray-600">{`(${req.data.claimer.username})`}</span>
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        wants to claim{" "}
                        <b className="text-primary">
                          {req.data.anon.first_name} {req.data.anon.last_name}
                        </b>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="default"
                      className="h-8 w-8 rounded-full dark:bg-background bg-slate-100 text-green-600 border hover:bg-green-600 hover:text-white cursor-pointer z-10"
                      onClick={() => handleClaimAction(req, "accept")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="default"
                      className="h-8 w-8 rounded-full dark:bg-background bg-slate-100 text-destructive border hover:bg-destructive hover:text-white cursor-pointer z-10"
                      onClick={() => handleClaimAction(req, "reject")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RequestInbox;
