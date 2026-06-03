import { supabase } from "../lib/supabaseClient";

export const getAuditLogs = async () => {
  return await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });
};

export const addAuditLog = async (log: {
  action: string;
  module: string;
  description: string;
}) => {
  return await supabase.from("audit_logs").insert([log]);
};