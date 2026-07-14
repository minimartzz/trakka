import WipOverlay from "@/components/account/WipOverlay";
import { Link2, Eye } from "lucide-react";
import React from "react";

const AccountsTab = () => {
  return (
    <div className="flex flex-col gap-8 py-6">
      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          Linked Accounts
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Sign in with other accounts, like Google.
        </p>
        <WipOverlay>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                <div className="h-3.5 w-32 flex-1 rounded bg-muted" />
                <div className="h-8 w-20 shrink-0 rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </WipOverlay>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Eye className="h-4 w-4 text-muted-foreground" />
          Account Visibility
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Control who can see your profile and stats.
        </p>
        <WipOverlay>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1.5">
              <div className="h-3.5 w-40 rounded bg-muted" />
              <div className="h-3 w-56 rounded bg-muted" />
            </div>
            <div className="h-6 w-11 shrink-0 rounded-full bg-muted" />
          </div>
        </WipOverlay>
      </section>
    </div>
  );
};

export default AccountsTab;
