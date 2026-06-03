import { supabase } from "../lib/supabaseClient";

export const getSuppliers = async () => {
  return await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });
};

export const addSupplier = async (supplier: {
  name: string;
  email: string;
  phone: string;
  address: string;
}) => {
  return await supabase.from("suppliers").insert([supplier]);
};

export const deleteSupplier = async (id: string) => {
  return await supabase.from("suppliers").delete().eq("id", id);
};