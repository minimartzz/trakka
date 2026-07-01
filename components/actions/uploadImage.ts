"use server";

import { createClient } from "@/utils/supabase/server";

const BUCKET = "images";
const MAX_BYTES = 2 * 1024 * 1024; // 2MB, generous for a 512px WebP
const ALLOWED_PATHS = new Set(["avatars", "groups"]);

type UploadResult =
  | { success: true; url: string }
  | { success: false; message: string };

export async function uploadCroppedImage(
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("file");
  const id = formData.get("id");
  const path = formData.get("path");

  if (!(file instanceof File)) {
    return { success: false, message: "No image was provided." };
  }
  if (typeof id !== "string" || !id.trim()) {
    return { success: false, message: "Missing image owner id." };
  }
  if (typeof path !== "string" || !ALLOWED_PATHS.has(path)) {
    return { success: false, message: "Invalid upload destination." };
  }
  if (file.type !== "image/webp") {
    return {
      success: false,
      message: "Image must be processed before upload.",
    };
  }
  if (file.size === 0) {
    return { success: false, message: "The image is empty." };
  }
  if (file.size > MAX_BYTES) {
    return {
      success: false,
      message: "Image is too large. Try a tighter crop.",
    };
  }

  const supabase = await createClient();

  // Replacing an image overwrites the same object
  const filePath = `${path}/${id}.webp`;

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: "image/webp",
  });

  if (error) {
    console.error("[Storage] upload failed:", error);
    return { success: false, message: "Couldn't upload the image. Try again." };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  // Cache-bust so the just-uploaded image is shown immediately even though the
  // path is unchanged. The bare URL (without the query) remains the canonical key.
  return { success: true, url: `${data.publicUrl}?v=${Date.now()}` };
}

/**
 * Remove a previously uploaded (non-default) image. No-op for default avatars
 * or the generic fallback, which are shared assets and must never be deleted.
 */
export async function removeUploadedImage(
  path: string,
  id: string,
): Promise<UploadResult> {
  if (!ALLOWED_PATHS.has(path) || !id.trim()) {
    return { success: false, message: "Invalid image reference." };
  }

  const supabase = await createClient();
  const filePath = `${path}/${id}.webp`;

  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) {
    console.error("[Storage] remove failed:", error);
    return { success: false, message: "Couldn't remove the image." };
  }

  return { success: true, url: "" };
}
