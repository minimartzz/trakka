"use client";

import { createContext, useContext } from "react";
import { User } from "@/lib/interfaces";

// Carries the user already resolved on the server (by a route-group layout) to
// client components, so they don't have to re-fetch it after hydration.
const UserContext = createContext<User | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

// Returns the signed-in user. Only valid inside a layout that has already
// gated on auth, which is why the user is non-nullable here — callers would
// never have rendered otherwise.
export function useUser(): User {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return user;
}