// TODO:
// 1. Change it to automatically search for first name & @ for username
"use client";
import { useDebounce } from "@/app/hooks/useDebounce";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface Profile {
  id: number;
  displayName: string | null;
  username: string;
}

interface PlayerInputProps {
  value: string;
  onChange: (value: string, userId?: number) => void;
  onNext?: () => void;
  placeholder?: string;
  className?: string;
  tabIndex?: number;
}

const PlayerInput: React.FC<PlayerInputProps> = ({
  value,
  onChange,
  onNext,
  placeholder,
  className,
  tabIndex,
}) => {
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search based on username if starts with @
  const searchTerm = value.startsWith("@") ? value.slice(1) : "";
  const shouldSearch = value.startsWith("@") && searchTerm.length > 0;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Retrieve suggestions from database
  const fetchSuggestions = useCallback(
    async (term: string) => {
      if (!term || !shouldSearch) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/suggestions?term=${encodeURIComponent(term)}`
        );
        if (!response.ok) {
          throw new Error("Suggestions response was not ok");
        }

        const data: Profile[] = await response.json();

        setSuggestions(data || []);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    },
    [shouldSearch]
  );

  // Fetch suggestions when debounced on input change
  useEffect(() => {
    if (shouldSearch) {
      fetchSuggestions(debouncedSearchTerm);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [debouncedSearchTerm, fetchSuggestions, shouldSearch]);

  // Handle changes on input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    onChange(newInput);

    // NOTE: Here it only allows you to search via username
    if (!newInput.startsWith("@")) {
      setShowDropdown(false);
      setSuggestions([]);
    }
  };

  // Handle keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Tab" && onNext) {
        e.preventDefault();
        onNext();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          setShowDropdown(false);
          setSuggestions([]);
          if (onNext) {
            setTimeout(onNext, 50);
          }
        }
        break;

      case "Tab":
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          // Let tab proceed naturally but close dropdown
          setShowDropdown(false);
          setSuggestions([]);
          if (onNext && !e.shiftKey) {
            e.preventDefault();
            setTimeout(onNext, 50);
          }
        }
        break;

      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Selecting a suggestion
  const selectSuggestion = (profile: Profile) => {
    const displayName = profile.displayName || profile.username;
    onChange(`@${displayName}`, profile.id);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setSuggestions([]);

    if (onNext) {
      setTimeout(onNext, 50);
    }
  };

  // Close dropdown when clicked out of focus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        tabIndex={tabIndex}
      />

      {showDropdown && (suggestions.length > 0 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-auto"
        >
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            suggestions.map((profile, index) => {
              const displayName = profile.displayName || profile.username;
              return (
                <div
                  key={profile.id}
                  onClick={() => selectSuggestion(profile)}
                  className={`px-3 py-2 cursor-pointer text-sm border-b border-border last:border-b-0 ${
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  @{displayName}
                  {profile.displayName &&
                    profile.username !== profile.displayName && (
                      <span className="text-muted-foreground ml-2">
                        ({profile.username})
                      </span>
                    )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerInput;
