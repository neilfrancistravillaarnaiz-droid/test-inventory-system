import { supabase } from "../lib/supabaseClient";

const announceCategoryChange = () =>
  window.dispatchEvent(new Event("stockflow:refresh-categories"));

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
  const result = await supabase.from("categories").insert([category]);
  if (!result.error) announceCategoryChange();
  return result;
};

export const deleteCategory = async (id: string) => {
  const result = await supabase.from("categories").delete().eq("id", id);
  if (!result.error) announceCategoryChange();
  return result;
};
