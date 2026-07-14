"use client";

import { updateProfileImage } from "@/app/(account)/account/action";
import AvatarUploader from "@/components/AvatarUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";
import React, { useState } from "react";
import { toast } from "sonner";

interface AccountAvatarDialogProps {
  userId: number;
  image: string;
  defaultImageUrl: string;
  altText: string;
}

/**
 * The header avatar doubles as its own edit trigger: click it to open the
 * uploader in a dialog, rather than duplicating avatar-edit UI inline in the
 * Profile section. A hover/focus overlay signals the image is clickable.
 */
const AccountAvatarDialog = ({
  userId,
  image,
  defaultImageUrl,
  altText,
}: AccountAvatarDialogProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleImageUrlChange = async (url: string | null) => {
    if (!url) return;
    setSaving(true);
    const result = await updateProfileImage(url);
    setSaving(false);

    if (result.success) {
      toast.success(result.message);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-border md:h-32 md:w-32 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Change profile picture"
      >
        <Image
          src={image}
          alt={altText}
          fill
          className="object-cover"
          sizes="128px"
          priority
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100 group-focus-visible:bg-black/40 group-focus-visible:opacity-100">
          <Camera className="h-6 w-6 text-white" />
        </span>
      </button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update profile picture</DialogTitle>
        </DialogHeader>
        <AvatarUploader
          userId={String(userId)}
          onImageUrlChange={handleImageUrlChange}
          initialImageUrl={image}
          defaultImageUrl={defaultImageUrl}
        />
        {saving && (
          <p className="text-center text-sm text-muted-foreground">
            Saving...
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AccountAvatarDialog;
