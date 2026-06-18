import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  LineChart,
  FileText,
  Bell,
  ScrollText,
  QrCode,
  Search,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import AIInventoryAssistant from "../components/ai/AIInventoryAssistant";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/stock-in", label: "Stock In", icon: ArrowDownToLine },
  { to: "/stock-out", label: "Stock Out", icon: ArrowUpFromLine },
  { to: "/stock-history", label: "History", icon: History },
  { to: "/restock-predictor", label: "Restock", icon: LineChart },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/audit-logs", label: "Audit", icon: ScrollText },
  { to: "/qr-codes", label: "Barcode", icon: QrCode },
  { to: "/qr-search", label: "QR Search", icon: Search },
];

const DashboardLayout = () => {
  const navigate = useNavigate();

  const [isLightMode, setIsLightMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
      setIsLightMode(true);
    }
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

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
    <div className="dashboard-layout command-layout">
      <main className="dashboard-main command-main">
        <header className="topbar command-topbar">
          <div className="command-brand">
            <span className="command-brand-mark">
              <Package size={21} />
            </span>
            <div>
              <h1>StockFlow Command Center</h1>
              <p>Control inventory, stocks, reports, QR tools, and alerts.</p>
            </div>
          </div>

          <div className="command-top-actions">
            <label className="command-search" aria-label="Search inventory">
              <Search size={16} />
              <input type="search" placeholder="Search inventory..." />
              <span>Ctrl K</span>
            </label>

            <div className="theme-toggle">
              <span aria-hidden="true">
                {isLightMode ? <Sun size={17} /> : <Moon size={17} />}
              </span>

              <label className="switch" aria-label="Toggle theme">
                <input
                  type="checkbox"
                  checked={isLightMode}
                  onChange={toggleTheme}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="profile-menu" ref={profileMenuRef}>
              <button
                type="button"
                className="command-icon-btn"
                aria-label="Sign out"
                onClick={handleLogout}
              >
                <LogOut size={18} />
              </button>

              <button
                type="button"
                className="supabase-avatar-btn"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <img
                  src="https://i.pravatar.cc/120?img=12"
                  alt="User Profile"
                />
              </button>

              {profileOpen && (
                <div className="supabase-profile-panel" role="menu">
                  <div className="profile-panel-header">
                    <img
                      src="https://i.pravatar.cc/120?img=12"
                      alt="User Profile"
                    />

                    <div>
                      <h3>StockFlow User</h3>
                      <p>Administrator</p>
                    </div>
                  </div>

                  <NavLink to="/users" onClick={() => setProfileOpen(false)}>
                    <User size={18} />
                    Manage Profile
                  </NavLink>

                  <NavLink
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings size={18} />
                    Account Settings
                  </NavLink>

                  <button type="button" onClick={handleLogout}>
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <Outlet />
      </main>

      <div className="dock-hover-zone" aria-hidden="true" />

      <nav className="command-dock">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                isActive ? "command-dock-item active" : "command-dock-item"
              }
              title={item.label}
            >
              <Icon size={23} strokeWidth={2.2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <AIInventoryAssistant />
    </div>
  );
};

export default DashboardLayout;
