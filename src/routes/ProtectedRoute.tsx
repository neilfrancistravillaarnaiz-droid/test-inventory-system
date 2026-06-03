import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const ProtectedRoute = () => {
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      setIsLoggedIn(!!data.session);
      setChecking(false);
    };

    checkUser();
  }, []);

  if (checking) {
    return <p style={{ textAlign: "center", marginTop: "40px" }}>Checking account...</p>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;