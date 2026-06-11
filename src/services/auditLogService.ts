const API_URL = "http://localhost:8000";

export type AuditLogInput = {
  action: string;
  module: string;
  description: string;
};

export const getAuditLogs = async () => {
  const response = await fetch(`${API_URL}/audit-logs`);

  if (!response.ok) {
    throw new Error("Failed to load audit logs.");
  }

  return response.json();
};

export const addAuditLog = async (log: AuditLogInput) => {
  const response = await fetch(`${API_URL}/audit-logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(log),
  });

  if (!response.ok) {
    throw new Error("Failed to add audit log.");
  }

  return response.json();
};