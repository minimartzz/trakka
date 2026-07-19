"use client";

import { respondToClaim } from "@/app/(account)/account/claim/action";
import { AnonymousMember } from "@/app/(account)/tribe/[id]/edit/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Copy, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

interface AnonymousPlayersSectionProps {
  groupId: string;
  members: AnonymousMember[];
}

// Shown on an anonymous player's row when a user has a pending claim on them.
// The SuperAdmin can approve or reject here (same action as the Inbox popover).
const PendingClaim = ({
  groupId,
  member,
}: {
  groupId: string;
  member: AnonymousMember;
}) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const respond = async (decision: "accept" | "reject") => {
    if (pending || member.claimerId == null) return;
    setPending(true);
    const result = await respondToClaim(
      member.profileId,
      groupId,
      member.claimerId,
      decision,
    );
    setPending(false);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message ?? "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
      <div className="min-w-0 text-xs">
        <span className="text-muted-foreground">Claim by </span>
        <span className="font-medium">
          {member.claimerFirstName} {member.claimerLastName}
        </span>{" "}
        <span className="text-muted-foreground">@{member.claimerUsername}</span>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="icon"
          type="button"
          disabled={pending}
          onClick={() => respond("accept")}
          className="h-8 w-8 rounded-full border bg-slate-100 text-green-600 hover:bg-green-600 hover:text-white dark:bg-background"
          aria-label="Accept claim"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          type="button"
          disabled={pending}
          onClick={() => respond("reject")}
          className="h-8 w-8 rounded-full border bg-slate-100 text-destructive hover:bg-destructive hover:text-white dark:bg-background"
          aria-label="Reject claim"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ClaimCodeCopy = ({
  claimCode,
  memberName,
}: {
  claimCode: string;
  memberName: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(claimCode);
      setCopied(true);
      toast.success("Claim code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy claim code");
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <code className="rounded-md bg-muted px-2 py-1 font-mono text-sm tabular-nums">
        {claimCode}
      </code>
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="h-11 w-11 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
        aria-label={`Copy claim code for ${memberName}`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};

// Mobile: full-width tap target with a labeled code, instead of a small
// icon button floating opposite the name row.
const ClaimCodeCopyMobile = ({
  claimCode,
  memberName,
}: {
  claimCode: string;
  memberName: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(claimCode);
      setCopied(true);
      toast.success("Claim code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy claim code");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy claim code for ${memberName}`}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-left active:bg-muted/70"
    >
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">Claim code</div>
        <code className="font-mono text-sm tabular-nums">{claimCode}</code>
      </div>
      {copied ? (
        <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
};

const AnonAvatar = ({ member }: { member: AnonymousMember }) => (
  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
    {member.profilePic && (
      <Image src={member.profilePic} alt="" fill className="object-cover" />
    )}
  </div>
);

const AnonymousPlayersSection = ({
  groupId,
  members,
}: AnonymousPlayersSectionProps) => {
  const [filter, setFilter] = useState("");

  const filteredMembers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q),
    );
  }, [members, filter]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Share a claim code with the real player so they can claim this profile
        when they sign up.
      </p>

      {/* Filter bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter anonymous players..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
          aria-label="Filter anonymous players"
        />
      </div>

      {/* Desktop: dense table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Games</TableHead>
              <TableHead className="text-right">Claim code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <React.Fragment key={member.profileId}>
                <TableRow
                  className={member.claimerId != null ? "border-b-0" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <AnonAvatar member={member} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          @{member.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {member.sessionsPlayed ?? 0}
                  </TableCell>
                  <TableCell>
                    {member.claimCode && (
                      <ClaimCodeCopy
                        claimCode={member.claimCode}
                        memberName={`${member.firstName} ${member.lastName}`}
                      />
                    )}
                  </TableCell>
                </TableRow>
                {member.claimerId != null && (
                  <TableRow>
                    <TableCell colSpan={3} className="pt-0">
                      <PendingClaim groupId={groupId} member={member} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {filteredMembers.map((member) => (
          <li
            key={member.profileId}
            className="flex flex-col gap-3 rounded-lg border p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <AnonAvatar member={member} />
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {member.firstName} {member.lastName}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  @{member.username} ·{" "}
                  <span className="tabular-nums">
                    {member.sessionsPlayed ?? 0}
                  </span>{" "}
                  games
                </div>
              </div>
            </div>
            {member.claimCode && (
              <ClaimCodeCopyMobile
                claimCode={member.claimCode}
                memberName={`${member.firstName} ${member.lastName}`}
              />
            )}
            {member.claimerId != null && (
              <PendingClaim groupId={groupId} member={member} />
            )}
          </li>
        ))}
      </ul>

      {filteredMembers.length === 0 && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {filter.trim()
            ? "No anonymous players match your filter."
            : "No anonymous players. They're created when you log a session with an unregistered player."}
        </p>
      )}
    </div>
  );
};

export default AnonymousPlayersSection;
