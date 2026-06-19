import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import {
  hasPermission,
  normalizeRole,
  type AppRole,
  type Permission,
} from "../constants/permissions";
import type { UserRole, UserStatus } from "../services/userService";

export type CurrentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole | null;
  status: UserStatus | null;
};

export const useCurrentProfile = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;

      if (!isMounted) return;

      setSession(currentSession);

      if (!currentSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const user = currentSession.user;
      const columns = "id, full_name, email, role, status";

      let { data } = await supabase
        .from("profiles")
        .select(columns)
        .eq("id", user.id)
        .maybeSingle();

      if (!data && user.email) {
        const response = await supabase
          .from("profiles")
          .select(columns)
          .eq("email", user.email)
          .maybeSingle();

        data = response.data;
      }

      if (!isMounted) return;

      setProfile((data as CurrentProfile | null) ?? null);
      setLoading(false);
    };

    loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const role: AppRole = normalizeRole(profile?.role);

  const can = useCallback(
    (permission: Permission) => hasPermission(role, permission),
    [role]
  );

  return {
    session,
    profile,
    role,
    loading,
    can,
  };
};
