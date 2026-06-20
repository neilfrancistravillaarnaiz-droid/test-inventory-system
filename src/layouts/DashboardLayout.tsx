import {
  type FormEvent,
  type TouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import LetterHoverText from "../components/common/LetterHoverText";
import { getUnreadNotificationCount } from "../services/notificationService";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  permission?: Permission;
  keywords?: string[];
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
  const { products, fetchProducts } = useProducts();
  const { profile, role, can } = useCurrentProfile();

  const [isLightMode, setIsLightMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const pullStartYRef = useRef<number | null>(null);

  const searchablePages = useMemo<NavItem[]>(
    () =>
      [
        ...navItems,
        { to: "/profile", label: "My Profile", icon: User, keywords: ["account"] },
        {
          to: "/inventory/add",
          label: "Add Product",
          icon: Package,
          permission: "inventory:create" as Permission,
          keywords: ["create product", "new item"],
        },
        {
          to: "/users",
          label: "Users",
          icon: User,
          permission: "users:manage" as Permission,
          keywords: ["roles", "accounts", "permissions"],
        },
        {
          to: "/settings",
          label: "Settings",
          icon: Settings,
          permission: "settings:manage" as Permission,
          keywords: ["preferences", "company"],
        },
      ].filter((item) => !item.permission || can(item.permission)),
    [can]
  );

  const productSearchResults = useMemo(() => {
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

  const pageSearchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return [];

    return searchablePages
      .filter((page) =>
        [page.label, page.to, ...(page.keywords || [])].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
      .slice(0, 5);
  }, [searchTerm, searchablePages]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
      setIsLightMode(true);
    }
  }, []);

  useEffect(() => {
    const refreshUnreadCount = async () => {
      const { count, error } = await getUnreadNotificationCount();

      if (!error) {
        setUnreadNotificationCount(count || 0);
      }
    };

    void refreshUnreadCount();
    window.addEventListener(
      "stockflow:refresh-notifications",
      refreshUnreadCount
    );

    const channel = supabase
      .channel(`stockflow-notifications-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => void refreshUnreadCount()
      )
      .subscribe();

    return () => {
      window.removeEventListener(
        "stockflow:refresh-notifications",
        refreshUnreadCount
      );
      void supabase.removeChannel(channel);
    };
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
      searchInputRef.current?.focus();
      return;
    }

    if (pageSearchResults.length > 0) {
      navigate(pageSearchResults[0].to);
      setSearchTerm("");
      setSearchFocused(false);
      return;
    }

    navigate(`/inventory?search=${encodeURIComponent(query)}`);
    setSearchFocused(false);
  };

  const openProduct = (id: string) => {
    navigate(`/products/${id}`);
    setSearchTerm("");
    setSearchFocused(false);
  };

  const openPage = (path: string) => {
    navigate(path);
    setSearchTerm("");
    setSearchFocused(false);
  };

  const refreshActiveData = async () => {
    setPullRefreshing(true);
    window.dispatchEvent(new Event("stockflow:refresh-products"));
    await fetchProducts();
    window.setTimeout(() => {
      setPullRefreshing(false);
      setPullDistance(0);
    }, 450);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY > 0 || pullRefreshing) return;

    pullStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (pullStartYRef.current === null || window.scrollY > 0 || pullRefreshing) {
      return;
    }

    const distance = Math.max(
      0,
      (event.touches[0]?.clientY ?? pullStartYRef.current) -
        pullStartYRef.current
    );

    if (distance > 8) {
      setPullDistance(Math.min(distance, 104));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= 78 && !pullRefreshing) {
      void refreshActiveData();
    } else {
      setPullDistance(0);
    }

    pullStartYRef.current = null;
  };

  const visibleNavItems = navItems.filter(
    (item) => !item.permission || can(item.permission)
  );

  const displayName =
    profile?.full_name || profile?.email || "StockFlow User";

  return (
    <div
      className="dashboard-layout command-layout"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className={`pull-refresh-indicator${
          pullDistance > 0 || pullRefreshing ? " is-visible" : ""
        }`}
        style={{
          transform: `translate(-50%, ${Math.min(pullDistance, 72)}px)`,
        }}
      >
        {pullRefreshing
          ? "Refreshing..."
          : pullDistance >= 78
          ? "Release to refresh"
          : "Pull to refresh"}
      </div>

      <main className="dashboard-main command-main">
        <header className="topbar command-topbar">
          <div className="command-brand">
            <span className="command-brand-mark">
              <video
                src="/logo.mp4"
                autoPlay
                loop
                muted
                playsInline
                aria-label="City College of Davao logo"
              />
            </span>
            <div className="command-brand-copy">
              <h1><LetterHoverText text="CCD Inventory System" /></h1>
              <p>Track inventory, stocks, reports, QR tools, and alerts.</p>
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
                placeholder="Search products or pages..."
                aria-label="Search products or system pages"
              />
              <span>Ctrl K</span>

              {searchFocused && searchTerm.trim() ? (
                <div className="command-search-results">
                  {pageSearchResults.length > 0 && (
                    <div className="command-search-group">
                      <p className="command-search-group-label">Pages</p>
                      {pageSearchResults.map((page) => {
                        const PageIcon = page.icon;

                        return (
                          <button
                            type="button"
                            className="command-page-result"
                            key={page.to}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => openPage(page.to)}
                          >
                            <PageIcon size={17} />
                            <span>
                              <strong>{page.label}</strong>
                              <small>{page.to}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {productSearchResults.length > 0 && (
                    <div className="command-search-group">
                      <p className="command-search-group-label">Products</p>
                      {productSearchResults.map((product) => (
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
                      ))}
                    </div>
                  )}

                  {pageSearchResults.length === 0 &&
                    productSearchResults.length === 0 && (
                      <p>No matching pages or products</p>
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
                  <NavLink
                    to="/profile"
                    className="profile-panel-header profile-panel-link"
                    onClick={() => setProfileOpen(false)}
                  >
                    <img
                      src="https://i.pravatar.cc/120?img=12"
                      alt="User Profile"
                    />

                    <div>
                      <h3>{displayName}</h3>
                      <p>{role}</p>
                    </div>
                  </NavLink>

                  <NavLink to="/profile" onClick={() => setProfileOpen(false)}>
                    <User size={18} />
                    My Profile
                  </NavLink>

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
              <span className="command-dock-icon-wrap">
                <Icon size={23} strokeWidth={2.2} />
                {item.to === "/notifications" && unreadNotificationCount > 0 && (
                  <b
                    className="notification-count-badge"
                    aria-label={`${unreadNotificationCount} unread notifications`}
                  >
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </b>
                )}
              </span>
              <span className="command-dock-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <AIInventoryAssistant />
    </div>
  );
};

export default DashboardLayout;
