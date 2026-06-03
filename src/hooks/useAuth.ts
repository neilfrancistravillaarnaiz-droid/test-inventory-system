import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };

    checkSession();
  }, []);

  return { isAuthenticated };
};