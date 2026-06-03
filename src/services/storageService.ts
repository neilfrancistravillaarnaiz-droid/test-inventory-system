import { supabase } from "../lib/supabaseClient";

export const uploadProductImage = async (
  file: File
) => {
  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file);

  if (error) {
    return { error };
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return {
    imageUrl: data.publicUrl,
    error: null,
  };
};