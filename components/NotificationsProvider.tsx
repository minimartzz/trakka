"use client";

import createClient from "@/utils/supabase/client";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface NotificationRow {
  id: string;
  type: string;
  data: { [key: string]: any };
  isRead: boolean;
  profileId: number;
  createdAt: string;
}

interface NotificationsContextValue {
  notifications: NotificationRow[]; // Current list
  setNotifications: Dispatch<SetStateAction<NotificationRow[]>>; // State setter to handle client interactions
  refetch: () => Promise<void>; // Sync from DB
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return ctx;
}

export function NotificationsProvider({
  profileId,
  children,
}: {
  profileId: number;
  children: ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const refetch = useCallback(async () => {
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch notifications:", error);
      return;
    }
    if (data) {
      setNotifications(data as NotificationRow[]);
    }
  }, [supabase, profileId]);

  // Single realtime channel for each user
  useEffect(() => {
    refetch();

    const channel = supabase
      .channel(`notifications-${profileId}-${crypto.randomUUID()}`)
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
            const row: NotificationRow = {
              id: payload.new.id,
              type: payload.new.type,
              data: payload.new.data,
              isRead: payload.new.is_read,
              profileId: payload.new.profile_id,
              createdAt: payload.new.created_at,
            };
            setNotifications((prev) => [row, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === payload.new.id
                  ? {
                      ...n,
                      isRead: payload.new.is_read,
                      data: payload.new.data,
                    }
                  : n,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profileId, refetch]);

  const value = useMemo(
    () => ({ notifications, setNotifications, refetch }),
    [notifications, refetch],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
