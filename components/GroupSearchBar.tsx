"use client";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

export interface SessionGroup {
  id: string;
  name: string;
}

interface GroupSearchBarProps {
  onSelect: (item: SessionGroup) => void;
}

const GroupSearchBar = ({ onSelect }: GroupSearchBarProps) => {
  const [allGroups, setAllGroups] = useState<SessionGroup[]>([]);
  const [showGroupDropdown, setShowGroupDropdown] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<SessionGroup | null>(null);
  const [groupSearch, setGroupSearch] = useState<string>("");

  // Get all group info
  // TODO: Filter based on logged in user ID
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch("/api/group");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: SessionGroup[] = await response.json();
        setAllGroups(data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchPosts();
  }, []); // Empty dependency array means this runs once on mount

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
                onSelect(group);
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
