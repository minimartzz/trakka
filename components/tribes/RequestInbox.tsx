"use client";
import React, { useEffect, useState } from "react";
import {
  getTribeRequestsByGroupId,
  updateTribeRequests,
} from "../actions/tribeRequests";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { Check, Inbox, User, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { TribeRequest } from "@/lib/interfaces";

const RequestInbox = ({
  tribeId,
  profileId,
  tribeImageUrl,
}: {
  tribeId: string;
  profileId: number;
  tribeImageUrl: string;
}) => {
  const [requests, setRequests] = useState<TribeRequest[]>([]);

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
      setRequests((prevRequests) =>
        prevRequests.filter((req) => {
          const isTarget =
            req.data.group_id === tribeId &&
            req.data.requester_id === requesterId;

          return !isTarget;
        }),
      );
      toast.success(result.message);
    } else {
      toast.error(result.message || "Something went wrong");
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      const results = await getTribeRequestsByGroupId(profileId, tribeId);

      if (results) {
        setRequests(results as unknown as TribeRequest[]);
      }
    };

    fetchRequests();
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 sm:w-fit sm:px-4 sm:rounded-md rounded-full p-0 bg-accent-2/80 hover:bg-accent-2 dark:hover:bg-accent-2/60 hover:cursor-pointer"
        >
          <Inbox className="!h-4 !w-4" />
          <span className="hidden sm:block">Inbox</span>
          {requests.length > 0 && (
            <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-semibold">
              {requests.length}
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
                    className="h-8 w-8 rounded-full dark:bg-background bg-slate-100 text-destructive border-1 hover:bg-destructive hover:text-white cursor-pointer z-10"
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
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RequestInbox;
