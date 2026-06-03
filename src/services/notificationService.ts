import { supabase } from "../lib/supabaseClient";

export type NotificationStatus = "Unread" | "Read";

export const getNotifications = async () => {
  return await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
};

export const addNotification = async (notification: {
  title: string;
  message: string;
  type: string;
  status: NotificationStatus;
}) => {
  return await supabase.from("notifications").insert([notification]);
};

export const updateNotificationStatus = async (
  id: string,
  status: NotificationStatus
) => {
  return await supabase
    .from("notifications")
    .update({ status })
    .eq("id", id);
};

export const deleteNotification = async (id: string) => {
  return await supabase.from("notifications").delete().eq("id", id);
};