import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  clearAdminOtpVerified,
  getProfileForAuthUser,
  isAdminOtpVerified,
} from "../services/authService";

const ProtectedRoute = () => {
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/login");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setRedirectTo("/login");
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }

      const { data: profile } = await getProfileForAuthUser(
        data.session.user.id,
        data.session.user.email
      );

      if (profile?.role === "Admin" && !isAdminOtpVerified()) {
        clearAdminOtpVerified();
        await supabase.auth.signOut();
        setRedirectTo("/admin-login");
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }

      setIsLoggedIn(true);
      setChecking(false);
    };

    checkUser();
  }, []);

  if (checking) {
    return <p style={{ textAlign: "center", marginTop: "40px" }}>Checking account...</p>;
  }

  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
