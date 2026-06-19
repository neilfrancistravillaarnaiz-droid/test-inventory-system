import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import AIInventoryAssistant from "../components/ai/AIInventoryAssistant";
import { useProducts } from "../hooks/useProducts";
import { useCurrentProfile } from "../hooks/useCurrentProfile";
import type { Permission } from "../constants/permissions";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  {
    to: "/categories",
    label: "Categories",
    icon: Tags,
    permission: "categories:manage",
  },
  {
    to: "/suppliers",
    label: "Suppliers",
    icon: Truck,
    permission: "suppliers:manage",
  },
  {
    to: "/stock-in",
    label: "Stock In",
    icon: ArrowDownToLine,
    permission: "stock:move",
  },
  {
    to: "/stock-out",
    label: "Stock Out",
    icon: ArrowUpFromLine,
    permission: "stock:move",
  },
  { to: "/stock-history", label: "History", icon: History },
  { to: "/restock-predictor", label: "Restock", icon: LineChart },
  { to: "/reports", label: "Reports", icon: FileText, permission: "reports:view" },
  { to: "/notifications", label: "Alerts", icon: Bell, permission: "alerts:view" },
  { to: "/audit-logs", label: "Audit", icon: ScrollText, permission: "audit:view" },
  { to: "/qr-codes", label: "Barcode", icon: QrCode, permission: "qr:view" },
  { to: "/qr-search", label: "QR Search", icon: Search, permission: "qr:view" },
];

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { profile, role, can } = useCurrentProfile();

  const [isLightMode, setIsLightMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return [];

    return products
      .filter((product) =>
        [
          product.name,
          product.sku,
          product.category,
          product.supplier,
          product.warehouse,
          product.shelf,
          product.rack,
          product.bin,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      )
      .slice(0, 5);
  }, [products, searchTerm]);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchTerm.trim();

    if (!query) {
      navigate("/inventory");
      return;
    }

    navigate(`/inventory?search=${encodeURIComponent(query)}`);
    setSearchFocused(false);
  };

  const openProduct = (id: string) => {
    navigate(`/products/${id}`);
    setSearchFocused(false);
  };

  const visibleNavItems = navItems.filter(
    (item) => !item.permission || can(item.permission)
  );

  const displayName =
    profile?.full_name || profile?.email || "StockFlow User";

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
            <form className="command-search" onSubmit={handleSearchSubmit}>
              <Search size={16} />
              <input
                ref={searchInputRef}
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  window.setTimeout(() => setSearchFocused(false), 140);
                }}
                placeholder="Search inventory..."
                aria-label="Search inventory"
              />
              <span>Ctrl K</span>

              {searchFocused && searchTerm.trim() ? (
                <div className="command-search-results">
                  {searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <button
                        type="button"
                        key={product.id}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openProduct(product.id)}
                      >
                        <strong>{product.name}</strong>
                        <small>
                          {product.category}
                          {product.sku ? ` | ${product.sku}` : ""}
                        </small>
                      </button>
                    ))
                  ) : (
                    <p>No matching products</p>
                  )}
                </div>
              ) : null}
            </form>

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
                      <h3>{displayName}</h3>
                      <p>{role}</p>
                    </div>
                  </div>

                  {can("users:manage") && (
                    <NavLink to="/users" onClick={() => setProfileOpen(false)}>
                      <User size={18} />
                      Manage Profile
                    </NavLink>
                  )}

                  {can("settings:manage") && (
                    <NavLink
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings size={18} />
                      Account Settings
                    </NavLink>
                  )}

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
        {visibleNavItems.map((item) => {
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
