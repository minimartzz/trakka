"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import React, { useState } from "react";

const GlobalSearchBar = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center">
      {/* Mobile: Icon only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden h-10 w-10 rounded-full hover:bg-muted"
      >
        <Search className="h-5 w-5" strokeWidth={3} />
      </Button>

      {/* Desktop: Search bar - note fake to trigger dialogue */}
      <div className="z-[60] hidden md:block relative">
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 md:flex items-center justify-center pl-3 hidden">
          <Search className="h-4 w-4" />
        </div>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={() => setOpen(true)}
          placeholder="Search anything..."
          className="z-60 bg-background pl-9 lg:w-100 md:80"
        />
      </div>

      {/* Full screen overlay */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay className="bg-black/70 backdrop-blur-xs" />

        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 w-screen h-screen min-w-full left-0 top-0 translate-x-0 translate-y-0 border-none bg-transparent shadow-none p-0 flex flex-col items-stretch [&>button:last-child]:hidden"
        >
          {/* className="min-w-full h-full top-20 border-none bg-transparent shadow-none p-0 [&>button:last-child]:hidden" */}
          {/* fixed inset-0 z-50 w-screen h-screen max-w-none left-0 top-0
          translate-x-0 translate-y-0 border-none bg-transparent shadow-none p-0
          flex flex-col items-stretch pt-4 */}
          <DialogHeader className="sr-only">
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          {/* Mobile: Input Box */}
          <div className="flex flex-col w-full max-w-4xl mt-3 px-4 animate-in slide-in-from-top-4 duration-300">
            <div className="sm:hidden relative flex items-center bg-white rounded-md shadow-xl overflow-hidden">
              <Search className="absolute left-4 h-5 w-5" />
              <Input
                placeholder="Search anything..."
                className="h-12 pl-12 text-lg border-none focus-visible:ring-0 text-black placeholder:text-gray-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-5 sm:top-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-7 h-7 text-gray-500" />
          </button>
          <div className="w-full overflow-wrap">
            <div className="p-7 pt-8 sm:p-12 sm:pt-20 text-white">
              {query ? (
                <div className="flex flex-col">
                  <h1 className="font-bold text-2xl md:text-4xl lg:text-5xl">
                    Search Results
                  </h1>
                  <p className="mt-2 text-xl">{query}</p>
                </div>
              ) : (
                <h1 className="font-bold text-2xl md:text-4xl lg:text-5xl">
                  Search for users, tribes, sessions, games...
                </h1>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalSearchBar;
