import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const DashboardLayout = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
      setIsLightMode(true);
    }
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const toggleTheme = () => {
    setIsLightMode((prev) => {
      const newMode = !prev;

      if (newMode) {
        document.body.classList.add("light-mode");
        localStorage.setItem("theme", "light");
      } else {
        document.body.classList.remove("light-mode");
        localStorage.setItem("theme", "dark");
      }

      return newMode;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      <button
        className="mobile-menu-btn"
        type="button"
        onClick={() => setSidebarOpen(true)}
      >
        ☰
      </button>

      <aside className={`sidebar ${sidebarOpen ? "show-sidebar" : ""}`}>
        <div className="sidebar-header">
          <h2 className="logo">StockFlow</h2>

          <button
            className="close-sidebar-btn"
            type="button"
            onClick={closeSidebar}
          >
            ×
          </button>
        </div>

        <nav>
          <NavLink to="/dashboard" onClick={closeSidebar}>Dashboard</NavLink>
          <NavLink to="/inventory" onClick={closeSidebar}>Inventory</NavLink>
          <NavLink to="/categories" onClick={closeSidebar}>Categories</NavLink>
          <NavLink to="/suppliers" onClick={closeSidebar}>Suppliers</NavLink>
          <NavLink to="/stock-in" onClick={closeSidebar}>Stock In</NavLink>
          <NavLink to="/stock-out" onClick={closeSidebar}>Stock Out</NavLink>
          <NavLink to="/stock-history" onClick={closeSidebar}>Stock History</NavLink>
          <NavLink to="/reports" onClick={closeSidebar}>Reports</NavLink>
          <NavLink to="/users" onClick={closeSidebar}>Users</NavLink>
          <NavLink to="/notifications" onClick={closeSidebar}>Notifications</NavLink>
          <NavLink to="/audit-logs" onClick={closeSidebar}>Audit Logs</NavLink>
          <NavLink to="/qr-codes" onClick={closeSidebar}>QR Codes</NavLink>
          <NavLink to="/qr-search" onClick={closeSidebar}>QR Search</NavLink>
          <NavLink to="/settings" onClick={closeSidebar}>Settings</NavLink>
        </nav>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <h1>Inventory Management</h1>
            <p>Manage stocks, products, suppliers, and reports.</p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div className="theme-toggle">
              <span>
                {isLightMode ? "☀️" : "🌙"}
              </span>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={isLightMode}
                  onChange={toggleTheme}
                />

                <span className="slider"></span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;