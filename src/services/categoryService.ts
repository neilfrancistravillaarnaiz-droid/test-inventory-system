import { supabase } from "../lib/supabaseClient";

export const getCategories = async () => {
  return await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });
};

export const addCategory = async (category: {
  name: string;
  description: string;
}) => {
  return await supabase.from("categories").insert([category]);
};

export const deleteCategory = async (id: string) => {
  return await supabase.from("categories").delete().eq("id", id);
};