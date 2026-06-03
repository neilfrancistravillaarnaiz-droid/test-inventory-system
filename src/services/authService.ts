import { supabase } from "../lib/supabaseClient";

export const login = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const register = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

export const logout = async () => {
  return await supabase.auth.signOut();
};

export const forgotPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost:5174/reset-password",
  });
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};