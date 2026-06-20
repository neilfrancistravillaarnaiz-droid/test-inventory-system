import { supabase } from "../lib/supabaseClient";
import type { ProductInput } from "../types/Product";
import { deleteStoredImage } from "./storageService";

const announceProductChange = (
  detail:
    | { type: "upsert"; product: unknown }
    | { type: "remove"; id: string }
) => {
  window.dispatchEvent(
    new CustomEvent("stockflow:refresh-products", { detail })
  );
};

export const getProducts = async () => {
  return await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
};

export const getProductById = async (id: string) => {
  return await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
};

export const addProduct = async (product: ProductInput) => {
  const result = await supabase
    .from("products")
    .insert([product])
    .select()
    .single();

  if (!result.error && result.data) {
    announceProductChange({ type: "upsert", product: result.data });
  }

  return result;
};

export const updateProduct = async (id: string, product: ProductInput) => {
  const result = await supabase
    .from("products")
    .update(product)
    .eq("id", id)
    .select()
    .single();

  if (!result.error && result.data) {
    announceProductChange({ type: "upsert", product: result.data });
  }

  return result;
};

export const deleteProduct = async (id: string) => {
  const { data: product } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  const result = await supabase.from("products").delete().eq("id", id);

  if (!result.error && product?.image_url) {
    await deleteStoredImage(product.image_url);
  }

  if (!result.error) {
    announceProductChange({ type: "remove", id });
  }

  return result;
};
