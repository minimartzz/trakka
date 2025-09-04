"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { db } from "@/utils/db";
import { groupTable } from "@/db/schema/group";
import createClient from "@/utils/supabase/client";

interface SessionGroup {
  id: string;
  name: string;
}

const GroupSearchBar = async () => {
  const [showGroupDropdown, setShowGroupDropdown] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<SessionGroup | null>(null);
  const [groupSearch, setGroupSearch] = useState<string>("");

  // Get all group info
  // TODO: Filter based on logged in user ID
  const supabase = createClient();
  const allGroups = await supabase.from("group").select("id, name");

  const getFilteredGroups = (query: string) => {
    if (!query) return [];
    return allGroups.filter((group) =>
      group.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleGroupInput = (query: string) => {
    setGroupSearch(query);
    if (query.length > 0) {
      setShowGroupDropdown(true);
    } else {
      setShowGroupDropdown(false);
      if (query === "") {
        setSelectedGroup(null);
      }
    }
  };

  return (
    <div className="relative">
      <Input
        id="tribe"
        type="text"
        placeholder={selectedGroup ? selectedGroup.name : "Search tribes..."}
        value={groupSearch}
        onChange={(e) => handleGroupInput(e.target.value)}
        onBlur={() => {
          setTimeout(() => setShowGroupDropdown(false), 200);
        }}
      />
      {showGroupDropdown && getFilteredGroups(groupSearch).length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-auto">
          {getFilteredGroups(groupSearch).map((group) => (
            <div
              key={group.id}
              onClick={() => {
                setSelectedGroup(group);
                setGroupSearch("");
                setShowGroupDropdown(false);
              }}
              className="px-3 py-2 hover:bg-accent cursor-pointer text-sm border-b border-border last:border-b-0"
            >
              {group.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupSearchBar;
