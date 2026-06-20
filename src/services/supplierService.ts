import { supabase } from "../lib/supabaseClient";

const announceSupplierChange = () =>
  window.dispatchEvent(new Event("stockflow:refresh-suppliers"));

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
  const result = await supabase.from("suppliers").insert([supplier]);
  if (!result.error) announceSupplierChange();
  return result;
};

export const deleteSupplier = async (id: string) => {
  const result = await supabase.from("suppliers").delete().eq("id", id);
  if (!result.error) announceSupplierChange();
  return result;
};
