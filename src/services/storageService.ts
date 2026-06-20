import { supabase } from "../lib/supabaseClient";

const STORAGE_BUCKET = "product-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const validateImage = (file: File) => {
  if (!file.type.startsWith("image/")) {
    return "Please select a valid image file.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Images must be 5 MB or smaller.";
  }

  return null;
};

const uploadImage = async (file: File, folder: string) => {
  const validationError = validateImage(file);

  if (validationError) {
    return { imageUrl: null, error: new Error(validationError) };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    const message = error.message.toLowerCase().includes("row-level security")
      ? "Image upload is blocked by Supabase Storage permissions. Run supabase-storage-policies.sql in the Supabase SQL Editor, then try again."
      : error.message;

    return { imageUrl: null, error: new Error(message) };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return { imageUrl: data.publicUrl, error: null };
};

export const uploadProductImage = (file: File) =>
  uploadImage(file, "products");

export const uploadProfileImage = (file: File, userId: string) =>
  uploadImage(file, `profiles/${userId}`);

export const deleteStoredImage = async (publicUrl?: string | null) => {
  if (!publicUrl) return { error: null };

  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) return { error: null };

  const path = decodeURIComponent(publicUrl.slice(markerIndex + marker.length));
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  return { error };
};
