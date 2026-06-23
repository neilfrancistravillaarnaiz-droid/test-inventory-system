import { supabase } from "../lib/supabaseClient";

export const ADMIN_OTP_STORAGE_KEY = "stockflow-admin-otp-verified-at";
const ADMIN_OTP_WINDOW_MS = 1000 * 60 * 60 * 8;

export const login = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const getProfileForAuthUser = async (userId: string, email?: string | null) => {
  let response = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status")
    .eq("id", userId)
    .maybeSingle();

  if (!response.data && email) {
    response = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status")
      .eq("email", email)
      .maybeSingle();
  }

  return response;
};

export const requestAdminEmailOtp = async (email: string) => {
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });
};

export const verifyAdminEmailOtp = async (email: string, token: string) => {
  return await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
};

export const markAdminOtpVerified = () => {
  sessionStorage.setItem(ADMIN_OTP_STORAGE_KEY, String(Date.now()));
};

export const clearAdminOtpVerified = () => {
  sessionStorage.removeItem(ADMIN_OTP_STORAGE_KEY);
};

export const isAdminOtpVerified = () => {
  const verifiedAt = Number(sessionStorage.getItem(ADMIN_OTP_STORAGE_KEY) || "0");

  return verifiedAt > 0 && Date.now() - verifiedAt < ADMIN_OTP_WINDOW_MS;
};

export const register = async (
  email: string,
  password: string,
  fullName?: string
) => {
  const response = await supabase.auth.signUp({
    email,
    password,
  });

  if (response.data.user && !response.error) {
    await supabase.from("profiles").upsert(
      {
        id: response.data.user.id,
        full_name: fullName || email.split("@")[0],
        email,
        role: "Viewer",
        status: "Active",
      },
      { onConflict: "id" }
    );
  }

  return response;
};

export const logout = async () => {
  clearAdminOtpVerified();
  return await supabase.auth.signOut();
};

export const forgotPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
};

export const updatePassword = async (password: string) => {
  return await supabase.auth.updateUser({ password });
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};
