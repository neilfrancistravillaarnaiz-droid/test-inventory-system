import { supabase } from "../lib/supabaseClient";

export type AppSettings = {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  currency: string;
  default_low_stock_limit: number;
  theme: string;
};

export type AppSettingsInput = Omit<AppSettings, "id">;

export const getSettings = async () => {
  return await supabase
    .from("app_settings")
    .select("*")
    .limit(1)
    .single();
};

export const updateSettings = async (
  id: string,
  settings: AppSettingsInput
) => {
  return await supabase
    .from("app_settings")
    .update(settings)
    .eq("id", id);
};