import { supabase } from "../lib/supabaseClient";
import type { ProductInput } from "../types/Product";

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
  return await supabase.from("products").insert([product]);
};

export const updateProduct = async (id: string, product: ProductInput) => {
  return await supabase.from("products").update(product).eq("id", id);
};

export const deleteProduct = async (id: string) => {
  return await supabase.from("products").delete().eq("id", id);
};