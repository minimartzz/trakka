"use client";

import TribeImageUploader from "@/components/TribeImageUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

interface DetailsSectionProps {
  tribeId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  defaultImageUrl: string;
  onImageUrlChange: (url: string | null) => void;
}

const DetailsSection = ({
  tribeId,
  name,
  description,
  imageUrl,
  defaultImageUrl,
  onImageUrlChange,
}: DetailsSectionProps) => {
  return (
    <section>
      <h2 className="text-lg font-semibold">Details</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Your tribe&apos;s name, description, and photo.
      </p>

      <div className="flex flex-col gap-5">
        <TribeImageUploader
          tribeId={tribeId}
          onImageUrlChange={onImageUrlChange}
          initialImageUrl={imageUrl}
          defaultImageUrl={defaultImageUrl}
        />

        <div>
          <Label htmlFor="groupName" className="mb-2">
            Tribe Name
          </Label>
          <Input
            id="groupName"
            name="groupName"
            defaultValue={name}
            maxLength={80}
            required
          />
        </div>

        <div>
          <Label htmlFor="description" className="mb-2">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={description}
            maxLength={500}
          />
        </div>
      </div>
    </section>
  );
};

export default DetailsSection;
