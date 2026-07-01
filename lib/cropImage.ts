// Turns a source image + a pixel crop region into a square, downscaled WebP blob.
// Used by ImageCropDialog so only the cropped image is ever uploaded.

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (e) => reject(e));
    // Allows cropping images served from another origin (e.g. Supabase CDN).
    image.crossOrigin = "anonymous";
    image.src = src;
  });

/**
 * Render the cropped region to a canvas, clamp it to `maxSize`, and encode as WebP.
 *
 * @param imageSrc  object URL or remote URL of the source image
 * @param crop      pixel crop region reported by react-easy-crop
 * @param maxSize   longest output edge in px (the crop is square, so width === height)
 * @param quality   WebP quality 0..1
 */
export async function getCroppedWebpBlob(
  imageSrc: string,
  crop: PixelCrop,
  maxSize = 512,
  quality = 0.85,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  // The crop is square; downscale to at most maxSize so we never store huge files.
  const outputSize = Math.min(Math.round(crop.width), maxSize);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode cropped image"));
      },
      "image/webp",
      quality,
    );
  });
}
