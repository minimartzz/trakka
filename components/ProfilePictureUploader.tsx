"use client";
import { Button } from "@/components/ui/button";
import createClient from "@/utils/supabase/client";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "sonner";

interface ProfilePictureUploaderProps {
  initialImageUrl?: string | null;
  defaultImageUrl: string;
  onImageUrlChange: (url: string | null) => void;
  userId: string;
  path: string;
}

const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  initialImageUrl,
  defaultImageUrl,
  onImageUrlChange,
  userId,
  path,
}) => {
  const supabase = createClient();
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialImageUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Unique filename for pictures
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    // Upload image to supabase bucket
    const { data, error } = await supabase.storage
      .from("images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      toast.error("Image upload failed");
      console.error(error);
    } else {
      const { data: publicUrlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);
      const newImageUrl = publicUrlData.publicUrl;
      const uniqueImageUrl = `${newImageUrl}?t=${Date.now()}`;
      setImageUrl(uniqueImageUrl);
      onImageUrlChange(uniqueImageUrl);
      toast.success("Profile picture update successfully!");
    }

    setIsUploading(false);
  };

  const handleImageRemove = async () => {
    // Remove the image from supabase bucket
    if (!imageUrl || imageUrl === defaultImageUrl) return;

    const fileName = imageUrl.split("/").pop();
    const filePath = `${path}/${fileName}`;

    const { error } = await supabase.storage.from("images").remove([filePath]);

    if (error) {
      toast.error("Failed to remove image");
      console.error(error);
    } else {
      setImageUrl(null);
      onImageUrlChange(null);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300">
        <Image
          src={imageUrl || defaultImageUrl}
          alt="Profile picture"
          layout="fill"
          objectFit="cover"
        />
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {imageUrl ? "Reupload" : "Upload"}
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </Button>

        {imageUrl && (
          <Button variant="outline" onClick={handleImageRemove}>
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
      {isUploading && <p>Uploading...</p>}
    </div>
  );
};

export default ProfilePictureUploader;
