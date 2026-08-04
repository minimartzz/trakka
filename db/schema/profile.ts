import { relations } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { profileGroupTable } from "./profileGroup";
import { usersTable } from "@/db/schema/authUser";
import { groupInvitesTable } from "@/db/schema/groupInvites";
import { groupJoinRequestTable } from "@/db/schema/groupJoinRequests";
import { notificationsTable } from "@/db/schema/notifications";

// Favourite game selected from BGG search during onboarding
// Directly collected from BGG API, not from games table to isolate usage
// Stored as jsonb
export type FavouriteGame = {
  bggId: number;
  title: string;
  // Full BGG image, not the thumbnail — the account page renders these at
  // card size, where a thumbnail would upscale visibly.
  image: string | null;
};

// Tribes user requested to join, but not sent out yet
export type DraftTribe = {
  id: string;
  name: string;
  image: string;
  source: "invite" | "search";
};

// Stored information for users returning to the onboarding process midway
export type OnboardingDraft = {
  tribes?: DraftTribe[];
  favouriteGames?: FavouriteGame[];
};

export const profileTable = pgTable("profile", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  uuid: uuid("uuid").references((): AnyPgColumn => usersTable.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  username: varchar("username").unique().notNull(),
  description: text("description").notNull(),
  gender: varchar("gender", { enum: ["Male", "Female", "Others"] }).notNull(),
  image: text("image").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  // ==== Claim-related ====
  claimCode: varchar("claim_code").unique(),
  // Pending-claim lock: Set to the claiming user's profile id while a claim
  // is awaiting tribe SuperAdmin approval. Only one user can hold the lock
  // at a time
  claimRequestedBy: integer("claim_requested_by").references(
    (): AnyPgColumn => profileTable.id,
  ),
  claimRequestedAt: timestamp("claim_requested_at"),
  // ==== Onboarding-related ====
  onboardingStep: smallint("onboarding_step").notNull().default(0),
  // Onboarding checkpoint: NULL value indicates user has not completed the onboarding
  // process. Authenticated surface will return them back to /onboarding
  onboardingCompletedAt: timestamp("onboarding_completed_at", {
    withTimezone: true,
  }),
  onboardingDraft: jsonb("onboarding_draft")
    .$type<OnboardingDraft>()
    .notNull()
    .default({}),
  favouriteGames: jsonb("favourite_games")
    .$type<FavouriteGame[]>()
    .notNull()
    .default([]),
  connectedAccounts: jsonb("connected_accounts")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
});

export const profileRelations = relations(profileTable, ({ many, one }) => ({
  profileGroup: many(profileGroupTable),
  usersTable: one(usersTable),
  groupInvites: many(groupInvitesTable),
  groupJoinRequests: many(groupJoinRequestTable),
  notifications: many(notificationsTable),
}));

export type SelectProfile = typeof profileTable.$inferSelect;
