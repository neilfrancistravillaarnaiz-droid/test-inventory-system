import { supabase } from "../lib/supabaseClient";

export const getStockMovements = async () => {
  return await supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false });
};

export const addStockMovement = async (movement: {
  product_id: string;
  product_name: string;
  type: "IN" | "OUT";
  quantity: number;
  note: string;
}) => {
  return await supabase.from("stock_movements").insert([movement]);
};

export const updateProductQuantity = async (
  productId: string,
  newQuantity: number
) => {
  return await supabase
    .from("products")
    .update({ quantity: newQuantity })
    .eq("id", productId);
};