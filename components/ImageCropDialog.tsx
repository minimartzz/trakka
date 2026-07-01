"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCroppedWebpBlob, type PixelCrop } from "@/lib/cropImage";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import React, { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

interface ImageCropDialogProps {
  /** Object URL of the file the user just selected. */
  src: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the final square WebP blob once the user confirms the crop. */
  onCropComplete: (blob: Blob) => Promise<void> | void;
  maxSize?: number;
}

const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  src,
  open,
  onOpenChange,
  onCropComplete,
  maxSize = 512,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!src || !croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const blob = await getCroppedWebpBlob(src, croppedAreaPixels, maxSize);
      await onCropComplete(blob);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
      // Reset for the next image.
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSaving) onOpenChange(next);
      }}
    >
      <DialogContent className="p-4 sm:p-6 w-[95%] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop your photo</DialogTitle>
          <DialogDescription>
            Drag to reposition, pinch or use the slider to zoom. Only the area
            inside the circle is saved.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            aria-label="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
          <ZoomIn
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving || !croppedAreaPixels}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save photo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
