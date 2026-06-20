import { supabase } from "../lib/supabaseClient";

export type NotificationStatus = "Unread" | "Read";

const announceNotificationChange = () => {
  window.dispatchEvent(new Event("stockflow:refresh-notifications"));
};

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
  const result = await supabase.from("notifications").insert([notification]);
  if (!result.error) announceNotificationChange();
  return result;
};

export const updateNotificationStatus = async (
  id: string,
  status: NotificationStatus
) => {
  const result = await supabase
    .from("notifications")
    .update({ status })
    .eq("id", id);
  if (!result.error) announceNotificationChange();
  return result;
};

export const deleteNotification = async (id: string) => {
  const result = await supabase.from("notifications").delete().eq("id", id);
  if (!result.error) announceNotificationChange();
  return result;
};

export const getUnreadNotificationCount = async () => {
  return await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("status", "Unread");
};
