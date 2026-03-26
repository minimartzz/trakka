"use client";
import {
  deleteNotification,
  markNotificationsAsRead,
} from "@/components/actions/notificationActions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import createClient from "@/utils/supabase/client";
import {
  Bell,
  X,
  Users,
  Dices,
  Circle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Notification types - extensible for future types
type NotificationType = "tribe_join" | "new_session";

interface ActivitiesInterface {
  id: string;
  type: NotificationType;
  data: { [key: string]: any };
  isRead: boolean;
  profileId: number;
  createdAt: string;
}

// Configuration for notification types - easily extensible
const NOTIFICATION_CONFIG: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  tribe_join: {
    icon: Users,
    label: "Tribe",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  new_session: {
    icon: Dices,
    label: "Session",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
};

const INITIAL_LOAD = 5;
const LOAD_MORE_COUNT = 5;

interface NotificationItemProps {
  notification: ActivitiesInterface;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDelete,
}) => {
  const config = NOTIFICATION_CONFIG[notification.type];
  const TypeIcon = config?.icon || Circle;

  const renderContent = () => {
    switch (notification.type) {
      case "new_session":
        return (
          <GameSessionContent
            gameImageUrl={notification.data.gameImageUrl}
            gameTitle={notification.data.gameTitle}
            tribeName={notification.data.tribeName}
          />
        );
      case "tribe_join":
        return (
          <TribeJoinContent
            tribeName={notification.data.tribeName}
            tribeImageUrl={notification.data.tribeImageUrl}
            outcome={notification.data.outcome}
          />
        );
      default:
        return <GenericContent data={notification.data} />;
    }
  };

  return (
    <div
      data-notification-id={notification.id}
      className={cn(
        "flex items-start gap-3 p-4 pb-6 border-b last:border-0 last:rounded-b-lg transition-colors relative",
        notification.isRead
          ? "bg-background hover:bg-accent/50"
          : "bg-primary/5 hover:bg-primary/10",
      )}
    >
      {/* Read Status Indicator */}
      <div className="absolute shrink-0 pt-1 top-2 right-10">
        {notification.isRead ? (
          <CheckCircle2 className="w-4 h-4 text-muted-foreground/50" />
        ) : (
          <Circle className="w-4 h-4 text-primary fill-primary" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">{renderContent()}</div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 -mr-2 -mt-2"
        onClick={() => onDelete(notification.id)}
      >
        <X className="h-3 w-3" />
      </Button>

      {/* Type Badge - Bottom Right */}
      <div
        className={cn(
          "absolute bottom-2 right-3 flex items-center justify-center w-6 h-6 rounded-full p-0",
          config?.bgColor || "bg-muted",
        )}
      >
        <TypeIcon
          className={cn(
            "w-4 h-4 rounded-full",
            config?.color || "text-muted-foreground",
          )}
        />
        {/* <span
          className={cn(
            "text-[10px] font-medium",
            config?.color || "text-muted-foreground"
          )}
        >
          {config?.label}
        </span> */}
      </div>
    </div>
  );
};

interface GameSessionContentProps {
  gameImageUrl: string;
  gameTitle: string;
  tribeName: string;
}

const GameSessionContent: React.FC<GameSessionContentProps> = ({
  gameImageUrl,
  gameTitle,
  tribeName,
}) => (
  <div className="flex items-center gap-3">
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm">
      <Image
        src={gameImageUrl}
        alt="Game Picture"
        className="object-cover"
        fill
      />
    </div>
    <div className="flex flex-col min-w-0">
      <h4 className="text-sm font-semibold leading-none">New Game Session</h4>
      <span className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
        A new session for <b className="font-medium">{gameTitle}</b> was
        recorded in{" "}
        <span className="font-medium text-primary">{tribeName}</span>
      </span>
    </div>
  </div>
);

interface TribeJoinContentProps {
  tribeName: string;
  tribeImageUrl: string;
  outcome: "accept" | "reject";
}

const TribeJoinContent: React.FC<TribeJoinContentProps> = ({
  tribeName,
  tribeImageUrl,
  outcome,
}) => (
  <div className="flex items-center gap-3">
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
      <Image
        src={tribeImageUrl}
        alt="Tribe Profile Picture"
        className="object-cover"
        fill
      />
    </div>
    <div className="flex flex-col min-w-0">
      <h4 className="text-sm font-semibold leading-none">
        {outcome === "accept" ? "Tribe Joined" : "Request Rejected"}
      </h4>
      <span className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
        Your request to join{" "}
        <b className="font-medium text-primary">{tribeName}</b> was{" "}
        {outcome === "accept" ? (
          <span className="font-medium text-green-600">accepted</span>
        ) : (
          <span className="font-medium text-destructive">rejected</span>
        )}
      </span>
    </div>
  </div>
);

// Generic fallback for future notification types
const GenericContent: React.FC<{ data: Record<string, any> }> = ({ data }) => (
  <div className="flex flex-col">
    <h4 className="text-sm font-semibold leading-none">Notification</h4>
    <span className="text-xs text-muted-foreground mt-1.5">
      {data.message || "You have a new notification"}
    </span>
  </div>
);

const ActivityLog = ({ profileId }: { profileId: number }) => {
  const supabase = createClient();
  const [activities, setActivities] = useState<ActivitiesInterface[]>([]);
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const readObserverRef = useRef<IntersectionObserver | null>(null);
  const loadMoreObserverRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const pendingReadIds = useRef<Set<string>>(new Set());
  const readTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markedAsReadIds = useRef<Set<string>>(new Set());
  const activitiesRef = useRef<ActivitiesInterface[]>([]);

  // Keep activitiesRef in sync with activities state
  activitiesRef.current = activities;

  // Computed values
  const unreadCount = useMemo(
    () => activities.filter((a) => !a.isRead).length,
    [activities],
  );

  const displayedActivities = useMemo(
    () => activities.slice(0, displayCount),
    [activities, displayCount],
  );

  const hasMore = displayCount < activities.length;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
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
      .in("type", Object.keys(NOTIFICATION_CONFIG))
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error:", error.message, error.details);
      toast.error("Failed to fetch notifications");
      return;
    }

    if (data) {
      setActivities(data);
      // Reset tracked read IDs when fetching fresh data
      markedAsReadIds.current.clear();
    }
  }, [supabase, profileId]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchNotifications();

    // Subscribe for realtime updates
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
          if (payload.eventType === "INSERT") {
            const notificationType = payload.new.type as string;
            // Only add notifications that match our configured types
            if (!(notificationType in NOTIFICATION_CONFIG)) {
              return;
            }
            // Add new notification at the top
            const newNotification = {
              id: payload.new.id,
              type: notificationType as NotificationType,
              data: payload.new.data,
              isRead: payload.new.is_read,
              profileId: payload.new.profile_id,
              createdAt: payload.new.created_at,
            };
            setActivities((prev) => [newNotification, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            // Update existing notification
            setActivities((prev) =>
              prev.map((a) =>
                a.id === payload.new.id
                  ? {
                      ...a,
                      isRead: payload.new.is_read,
                      data: payload.new.data,
                    }
                  : a,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            // Remove deleted notification
            setActivities((prev) =>
              prev.filter((a) => a.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, supabase, fetchNotifications]);

  // Debounced mark as read function
  const flushPendingReads = useCallback(async () => {
    const ids = Array.from(pendingReadIds.current);
    if (ids.length === 0) return;

    pendingReadIds.current.clear();

    // Track these as marked so we don't re-process them
    ids.forEach((id) => markedAsReadIds.current.add(id));

    // Optimistically update UI
    setActivities((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, isRead: true } : a)),
    );

    // Persist to database
    const result = await markNotificationsAsRead(ids);
    if (result.error) {
      // Revert on error
      ids.forEach((id) => markedAsReadIds.current.delete(id));
      setActivities((prev) =>
        prev.map((a) => (ids.includes(a.id) ? { ...a, isRead: false } : a)),
      );
      console.error("Failed to mark notifications as read");
    }
  }, []);

  // Schedule read flush with debounce
  const scheduleReadFlush = useCallback(() => {
    if (readTimeoutRef.current) {
      clearTimeout(readTimeoutRef.current);
    }
    readTimeoutRef.current = setTimeout(flushPendingReads, 500);
  }, [flushPendingReads]);

  // Function to set up observers - called after DOM is ready
  const setupObservers = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Set up read observer
    readObserverRef.current?.disconnect();

    const handleReadIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLDivElement;
          const notificationId = element.dataset.notificationId;

          if (notificationId) {
            // Use ref to get current activities state
            const notification = activitiesRef.current.find(
              (a) => a.id === notificationId,
            );
            const alreadyMarked = markedAsReadIds.current.has(notificationId);

            if (notification && !notification.isRead && !alreadyMarked) {
              pendingReadIds.current.add(notificationId);
              scheduleReadFlush();
            }
          }
        }
      });
    };

    readObserverRef.current = new IntersectionObserver(handleReadIntersection, {
      root: container,
      rootMargin: "0px",
      threshold: 0.5,
    });

    // Observe all notification items
    const items = container.querySelectorAll("[data-notification-id]");
    items.forEach((item) => readObserverRef.current?.observe(item));

    // Set up load more observer
    loadMoreObserverRef.current?.disconnect();

    if (loadMoreTriggerRef.current) {
      const handleLoadMoreIntersection = (
        entries: IntersectionObserverEntry[],
      ) => {
        if (entries[0]?.isIntersecting) {
          setIsLoadingMore((currentLoading) => {
            if (currentLoading) return currentLoading;

            setTimeout(() => {
              setDisplayCount((prev) =>
                Math.min(prev + LOAD_MORE_COUNT, activitiesRef.current.length),
              );
              setIsLoadingMore(false);
            }, 200);

            return true;
          });
        }
      };

      loadMoreObserverRef.current = new IntersectionObserver(
        handleLoadMoreIntersection,
        {
          root: container,
          rootMargin: "100px",
          threshold: 0.1,
        },
      );

      loadMoreObserverRef.current.observe(loadMoreTriggerRef.current);
    }
  }, [scheduleReadFlush]);

  // Set up observers when popover opens and content changes
  useEffect(() => {
    if (!isOpen) {
      readObserverRef.current?.disconnect();
      loadMoreObserverRef.current?.disconnect();
      setIsMounted(false);
      return;
    }

    // Use requestAnimationFrame to wait for DOM to be ready
    const frameId = requestAnimationFrame(() => {
      setIsMounted(true);
      setupObservers();
    });

    return () => {
      cancelAnimationFrame(frameId);
      readObserverRef.current?.disconnect();
      loadMoreObserverRef.current?.disconnect();
    };
  }, [isOpen, setupObservers]);

  // Re-setup observers when displayed activities change (for new items)
  useEffect(() => {
    if (!isOpen || !isMounted) return;

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      setupObservers();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [isOpen, isMounted, displayedActivities.length, setupObservers]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
      }
    };
  }, []);

  // Reset display count when popover closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Flush any pending reads when closing
      flushPendingReads();
      // Reset display count after a delay to avoid flash
      setTimeout(() => {
        setDisplayCount(INITIAL_LOAD);
        markedAsReadIds.current.clear();
      }, 300);
    }
  };

  const handleDelete = async (notificationId: string) => {
    const prevActivities = [...activities];
    setActivities(activities.filter((a) => a.id !== notificationId));

    const result = await deleteNotification(notificationId);
    if (result?.error) {
      setActivities(prevActivities);
      toast.error("Failed to delete notification");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Bell className="h-6 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] sm:w-[380px] p-0" align="start">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <span className="font-semibold text-sm">Activity Log</span>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Notification Type Legend */}
        <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/30">
          {Object.entries(NOTIFICATION_CONFIG).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full",
                    config.bgColor,
                  )}
                >
                  <Icon className={cn("w-3 h-3", config.color)} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Notifications List with Infinite Scroll */}
        <div
          ref={scrollContainerRef}
          className="max-h-[400px] overflow-y-auto overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {activities.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No recent activity
              </p>
            </div>
          ) : (
            <>
              {displayedActivities.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDelete={handleDelete}
                />
              ))}

              {/* Load More Trigger / Loading State */}
              {hasMore && (
                <div
                  ref={loadMoreTriggerRef}
                  className="flex items-center justify-center py-4"
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Scroll for more
                    </span>
                  )}
                </div>
              )}

              {/* End of notifications indicator */}
              {!hasMore && activities.length > INITIAL_LOAD && (
                <div className="py-3 text-center text-xs text-muted-foreground border-t">
                  You&apos;ve reached the end
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ActivityLog;
