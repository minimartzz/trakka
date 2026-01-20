"use client";
import { handleRequestAction } from "@/app/(generic)/join/[code]/action";
import { deleteNotification } from "@/components/actions/notificationActions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { positionOrdinalSuffix } from "@/utils/recordsProcessing";
import createClient from "@/utils/supabase/client";
import { Bell, Check, User, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface ActivitiesInterface {
  id: string;
  type: "tribe_join" | "new_session"; // NOTE: Change here if more notif types are added
  data: { [key: string]: any };
  isRead: boolean;
  profileId: number;
  createdAt: string;
}

interface GameSessionNotificationProps {
  notificationId: string;
  gameImageUrl: string;
  gameTitle: string;
  tribeName: string;
  deleteFunc: (notificationId: string) => void;
}

interface TribeJoinNotificationProps {
  notificationId: string;
  tribeName: string;
  tribeImageUrl: string;
  outcome: "accept" | "reject";
  deleteFunc: (notificationId: string) => void;
}

const GameSessionNotification = ({
  notificationId,
  gameImageUrl,
  gameTitle,
  tribeName,
  deleteFunc,
}: GameSessionNotificationProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm">
        <Image
          src={gameImageUrl}
          alt="Game Picture"
          className="object-cover"
          fill
        />
      </div>
      <div className="flex flex-col">
        <h4 className="text-sm font-bold leading-none">New Game Session</h4>
        <span className="text-xs text-muted-foreground mt-2">
          A new session for
          <b className="text-semibold"> {gameTitle}</b> was just recorded under{" "}
          <span className="font-semibold text-primary">{tribeName}</span>
        </span>
      </div>
      <Button
        variant="ghost"
        className="relative bottom-5 -right-1 h-4 w-4 z-60"
        onClick={() => deleteFunc(notificationId)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

const TribeJoinNotification = ({
  notificationId,
  tribeName,
  tribeImageUrl,
  outcome,
  deleteFunc,
}: TribeJoinNotificationProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
        <Image
          src={tribeImageUrl}
          alt="Tribe Profile Picture"
          className="object-cover"
          fill
        />
      </div>
      <div className="flex flex-col">
        <h4 className="text-sm font-bold leading-none">
          {outcome === "accept" ? "Tribe Joined" : "Tribe Rejected"}
        </h4>
        <span className="text-xs text-muted-foreground mt-2">
          Your request to join
          <b className="text-semibold text-primary"> {tribeName}</b> has been{" "}
          {outcome === "accept" ? (
            <span className="font-semibold text-green-600">accepted</span>
          ) : (
            <span className="font-semibold text-destructive">rejected</span>
          )}
        </span>
      </div>
      <Button
        variant="ghost"
        className="relative bottom-5 -right-1 h-4 w-4 z-60"
        onClick={() => deleteFunc(notificationId)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

const ActivityLog = ({ profileId }: { profileId: number }) => {
  const supabase = createClient();
  const [activities, setActivities] = useState<ActivitiesInterface[]>([]);
  const [unreadActivities, setUnreadActivities] = useState<
    ActivitiesInterface[]
  >([]);
  const [isPending, startTransition] = useTransition();

  const handleOpenActivities = () => {
    // Don't run if all activities have been seen
    if (unreadActivities.length === 0) return;

    // Perform update on unread activities
    setUnreadActivities([]);

    // Update the database
    startTransition(async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("profile_id", profileId)
        .eq("is_read", false);

      if (error) {
        toast.error("Failed to retrieve/ update notifications");
        console.log(error);
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
          type, 
          data,
          isRead:is_read,
          profileId:profile_id,
          createdAt:created_at
        `,
        )
        .eq("profile_id", profileId)
        // .eq("is_read", false)
        .in("type", ["tribe_join", "new_session"]) // NOTE: Change here if more notif types are added
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error.message, error.details);
        toast.error("Failed to fetch notifications");
        return;
      }

      // Set all retrieved activities for the user
      if (data) setActivities(data);

      // Set all unread activities separately
      const unread = data.filter((activity) => !activity.isRead);
      setUnreadActivities(unread);
    };

    fetchRequests();

    // Subscribe for updating requests
    const channel = supabase
      .channel("activity_log")
      .on(
        "postgres_changes",
        {
          schema: "public",
          table: "notifications",
          event: "*",
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            fetchRequests();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, supabase]);

  const handleDelete = async (notificationId: string) => {
    // Remove from list
    const prevActivities = [...activities];
    setActivities(
      activities.filter((activity) => activity.id !== notificationId),
    );

    // Update notifications table
    const result = await deleteNotification(notificationId);
    if (result?.error) {
      setActivities(prevActivities);
      toast.error("Failed to delete notification");
    } else {
      toast.success("Notification deleted");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full"
          onClick={handleOpenActivities}
        >
          <Bell className="h-6 w-5" />
          {unreadActivities.length > 0 && (
            <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-semibold">
              {unreadActivities.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-85 sm:w-90 p-0" align="start">
        <div className="p-2 pl-3 font-semibold border-b text-sm">
          Activity Log
        </div>
        <div
          className="max-h-80 overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {activities.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No recent activity
            </p>
          ) : (
            activities.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-4 border-b last:border-0 last:rounded-b-lg hover:bg-accent transition-colors"
              >
                {req.type === "new_session" && (
                  <GameSessionNotification
                    notificationId={req.id}
                    gameImageUrl={req.data.gameImageUrl}
                    gameTitle={req.data.gameTitle}
                    tribeName={req.data.tribeName}
                    deleteFunc={handleDelete}
                  />
                )}
                {req.type === "tribe_join" && (
                  <TribeJoinNotification
                    notificationId={req.id}
                    tribeName={req.data.tribeName}
                    tribeImageUrl={req.data.tribeImageUrl}
                    outcome={req.data.outcome}
                    deleteFunc={handleDelete}
                  />
                )}
                {/* <div className="flex items-center gap-3">
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
                </div> */}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ActivityLog;
