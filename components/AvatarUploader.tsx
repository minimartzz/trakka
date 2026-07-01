"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ImageCropDialog from "@/components/ImageCropDialog";
import { uploadCroppedImage } from "@/components/actions/uploadImage";
import { cn } from "@/lib/utils";
import { Check, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AvatarUploaderProps {
  initialImageUrl?: string | null;
  defaultImageUrl: string;
  onImageUrlChange: (url: string | null) => void;
  /** userId used as the storage key */
  userId: string;
}

const DEFAULT_AVATARS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/profile/default_${i + 1}.png`,
  alt: `Default avatar ${i + 1}`,
}));

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  initialImageUrl,
  defaultImageUrl,
  onImageUrlChange,
  userId,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialImageUrl ?? null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke the temporary object URL when the crop dialog closes.
  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Always reset so re-selecting the same file fires onChange again.
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    setCropSrc(URL.createObjectURL(file));
    setCropOpen(true);
  };

  const handleCropComplete = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, `${userId}.webp`);
      formData.append("id", userId);
      formData.append("path", "avatars");

      const result = await uploadCroppedImage(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setImageUrl(result.url);
      onImageUrlChange(result.url);
      toast.success("Photo updated.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectDefault = (url: string) => {
    // Default avatars are shared, referenced by URL only. Nothing is uploaded.
    setImageUrl(url);
    onImageUrlChange(url);
  };

  const previewUrl = imageUrl ?? defaultImageUrl;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Live preview */}
      <div className="relative h-28 w-28 shrink-0">
        <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-border">
          <Image
            src={previewUrl}
            alt="Your profile photo"
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Default avatar grid: 4 x 2, all visible without scrolling on mobile */}
      <div className="w-full">
        <p className="mb-2 text-center text-sm text-muted-foreground">
          Pick a default, or upload your own
        </p>
        <div className="mx-auto grid w-fit grid-cols-4 gap-3">
          {DEFAULT_AVATARS.map((avatar) => {
            const selected = imageUrl === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => handleSelectDefault(avatar.url)}
                aria-pressed={selected}
                aria-label={avatar.alt}
                className={cn(
                  "relative rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  selected
                    ? "ring-2 ring-primary ring-offset-2"
                    : "ring-1 ring-border hover:ring-2 hover:ring-primary/60",
                )}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={avatar.url} alt="" />
                  <AvatarFallback />
                </Avatar>
                {selected && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="button" disabled={isUploading} asChild>
        <label className="cursor-pointer">
          <Upload className="h-4 w-4" />
          {imageUrl && !DEFAULT_AVATARS.some((a) => a.url === imageUrl)
            ? "Replace photo"
            : "Upload photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </Button>

      <ImageCropDialog
        src={cropSrc}
        open={cropOpen}
        onOpenChange={setCropOpen}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default AvatarUploader;
