import { supabase } from "../lib/supabaseClient";

export const login = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
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
  return await supabase.auth.signOut();
};

export const forgotPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};
