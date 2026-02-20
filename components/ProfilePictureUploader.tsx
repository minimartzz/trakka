"use client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
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

const DEFAULT_AVATARS = [
  {
    id: 1,
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/avatars/default_1.png`,
    alt: "Generic Profile 1",
  },
  {
    id: 2,
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/avatars/default_2.png`,
    alt: "Generic Profile 2",
  },
  {
    id: 3,
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/avatars/default_3.png`,
    alt: "Generic Profile 3",
  },
  {
    id: 4,
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/avatars/default_4.png`,
    alt: "Generic Profile 4",
  },
  {
    id: 5,
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/avatars/default_5.png`,
    alt: "Generic Profile 5",
  },
  {
    id: 6,
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/avatars/default_6.jpg`,
    alt: "Generic Profile 6",
  },
  {
    id: 7,
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/avatars/default_7.png`,
    alt: "Generic Profile 7",
  },
];

const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  initialImageUrl,
  defaultImageUrl,
  onImageUrlChange,
  userId,
  path,
}) => {
  const supabase = createClient();
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialImageUrl || null,
  );
  const [isUploading, setIsUploading] = useState(false);

  // Handle image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
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

  // Handle image removal
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

  // Handle default profile pictures
  const handleDefaultImage = (imageUrl: string) => {
    setImageUrl(imageUrl);
    onImageUrlChange(imageUrl);
    toast.success("Profile picture updated successfully!");
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-full">
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300 shrink-0">
        <Image
          src={imageUrl || defaultImageUrl}
          alt="Profile picture"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="w-70 sm:w-full">
        <div className="flex flex-nowrap items-center gap-3 py-2 px-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory justify-start sm:justify-center">
          {DEFAULT_AVATARS.map((avatar) => (
            <Button
              key={avatar.id}
              type="button"
              onClick={() => handleDefaultImage(avatar.url)}
              variant="ghost"
              className="rounded-lg p-0 h-auto w-auto hover:ring-2 hover:ring-primary transition-all duration-150"
            >
              <Avatar className="rounded-lg h-10 w-10">
                <AvatarImage src={avatar.url} alt={avatar.alt} />
              </Avatar>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" asChild>
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
          <Button variant="outline" onClick={handleImageRemove} type="button">
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
