"use client";

import { Button } from "@/components/ui/button";
import ImageCropDialog from "@/components/ImageCropDialog";
import {
  removeUploadedImage,
  uploadCroppedImage,
} from "@/components/actions/uploadImage";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface TribeImageUploaderProps {
  /** Current tribe image, if one is already set. */
  initialImageUrl?: string | null;
  /** The single house default shown when no custom image is set. */
  defaultImageUrl: string;
  onImageUrlChange: (url: string | null) => void;
  /** Stable tribe id used as the storage key. */
  tribeId: string;
}

const TribeImageUploader: React.FC<TribeImageUploaderProps> = ({
  initialImageUrl,
  defaultImageUrl,
  onImageUrlChange,
  tribeId,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialImageUrl ?? null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      formData.append("file", blob, `${tribeId}.webp`);
      formData.append("id", tribeId);
      formData.append("path", "groups");

      const result = await uploadCroppedImage(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setImageUrl(result.url);
      onImageUrlChange(result.url);
      toast.success("Tribe photo updated.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    // Only a custom upload can be removed; the shared default is never deleted.
    if (!imageUrl) return;
    setIsUploading(true);
    try {
      await removeUploadedImage("groups", tribeId);
      setImageUrl(null);
      onImageUrlChange(null);
    } finally {
      setIsUploading(false);
    }
  };

  const previewUrl = imageUrl ?? defaultImageUrl;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-border">
          <Image
            src={previewUrl}
            alt="Tribe photo"
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

      <div className="flex gap-2">
        <Button type="button" disabled={isUploading} asChild>
          <label className="cursor-pointer">
            <Upload className="h-4 w-4" />
            {imageUrl ? "Replace photo" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </Button>

        {imageUrl && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      <ImageCropDialog
        src={cropSrc}
        open={cropOpen}
        onOpenChange={setCropOpen}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default TribeImageUploader;
