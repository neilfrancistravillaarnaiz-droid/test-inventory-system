import { supabase } from "../lib/supabaseClient";

export type UserRole = "Admin" | "Staff" | "Viewer";
export type UserStatus = "Active" | "Inactive";

export type ProfileInput = {
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export const getProfiles = async () => {
  return await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
};

export const addProfile = async (profile: ProfileInput) => {
  return await supabase.from("profiles").insert([profile]);
};

export const updateProfile = async (id: string, profile: ProfileInput) => {
  return await supabase.from("profiles").update(profile).eq("id", id);
};

export const deleteProfile = async (id: string) => {
  return await supabase.from("profiles").delete().eq("id", id);
};