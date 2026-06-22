import { supabase } from "../lib/supabaseClient";

export type AuditLog = {
  id: string;
  action: string;
  module: string;
  description: string;
  created_at: string;
};

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
  const result = await supabase.from("audit_logs").insert([log]);

  if (!result.error) {
    window.dispatchEvent(new Event("stockflow:refresh-audit-logs"));
  }

  return result;
};

export const getRecentAuditLogs = async (limit = 5) => {
  return await supabase
    .from("audit_logs")
    .select("id, action, module, description, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
};
