import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Bell,
  CalendarDays,
  CircleDollarSign,
  FileDown,
  History,
  MapPin,
  Package,
  Pencil,
  Plus,
  ScanLine,
  Trash2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { useCurrentProfile } from "../../hooks/useCurrentProfile";
import LetterHoverText from "../../components/common/LetterHoverText";
import { supabase } from "../../lib/supabaseClient";
import {
  getRecentAuditLogs,
  type AuditLog,
} from "../../services/auditLogService";

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

type ActivityStyle = {
  className: "success" | "danger" | "blue" | "gold";
  icon: LucideIcon;
};

const getActivityStyle = (log: AuditLog): ActivityStyle => {
  const value = `${log.action} ${log.module}`.toLowerCase();

  if (value.includes("delete") || value.includes("remove")) {
    return { className: "danger", icon: Trash2 };
  }

  if (value.includes("stock out")) {
    return { className: "danger", icon: ArrowUpFromLine };
  }

  if (value.includes("stock in") || value.includes("add")) {
    return { className: "success", icon: ArrowDownToLine };
  }

  if (value.includes("location") || value.includes("assign")) {
    return { className: "blue", icon: MapPin };
  }

  if (value.includes("edit") || value.includes("update")) {
    return { className: "gold", icon: Pencil };
  }

  return { className: "blue", icon: History };
};

const formatRelativeTime = (dateValue: string, now: number) => {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - new Date(dateValue).getTime()) / 1000)
  );

  if (elapsedSeconds < 60) return "now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d`;

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateValue));
};

const Dashboard = () => {
  const { products, loading } = useProducts();
  const { can } = useCurrentProfile();
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const fetchRecentActivity = useCallback(async () => {
    const { data, error } = await getRecentAuditLogs(5);

    if (error) {
      console.error("Unable to load dashboard activity:", error.message);
    } else {
      setRecentActivity((data as AuditLog[]) || []);
    }

    setActivityLoading(false);
  }, []);

  useEffect(() => {
    void fetchRecentActivity();

    const handleAuditRefresh = () => void fetchRecentActivity();
    window.addEventListener("stockflow:refresh-audit-logs", handleAuditRefresh);

    const channel = supabase
      .channel(`stockflow-dashboard-activity-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_logs" },
        handleAuditRefresh
      )
      .subscribe();

    const clock = window.setInterval(() => setNow(Date.now()), 60_000);

    return () => {
      window.removeEventListener(
        "stockflow:refresh-audit-logs",
        handleAuditRefresh
      );
      window.clearInterval(clock);
      void supabase.removeChannel(channel);
    };
  }, [fetchRecentActivity]);

  const totalProducts = products.length;
  const totalQuantity = products.reduce(
    (sum, product) => sum + (product.quantity || 0),
    0
  );
  const inventoryValue = products.reduce(
    (sum, product) => sum + (product.quantity || 0) * (product.price || 0),
    0
  );
  const lowStockProducts = products.filter(
    (product) => product.quantity <= product.low_stock_limit
  );
  const lowStockItems = lowStockProducts.length;
  const chartProducts = products.slice(0, 7);
  const maxQuantity = Math.max(
    1,
    ...chartProducts.map((product) => product.quantity || 0)
  );
  const categorySummary = Array.from(
    products.reduce((categories, product) => {
      const category = product.category?.trim() || "Uncategorized";
      const current = categories.get(category) || {
        name: category,
        products: 0,
        quantity: 0,
        value: 0,
      };

      current.products += 1;
      current.quantity += product.quantity || 0;
      current.value += (product.quantity || 0) * (product.price || 0);
      categories.set(category, current);

      return categories;
    }, new Map<string, { name: string; products: number; quantity: number; value: number }>())
      .values()
  )
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const today = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  if (loading) {
    return <div className="loader">Loading dashboard...</div>;
  }

  return (
    <section className="dashboard-command-page">
      <div className="dashboard-command-header">
        <div>
          <h2><LetterHoverText text="Dashboard" /></h2>
          <p>Welcome to your inventory system.</p>
        </div>
        <span className="dashboard-date-pill">
          <CalendarDays size={14} />
          {today}
        </span>
      </div>

      <div className="dashboard-stat-grid">
        <article className="dashboard-stat-card">
          <span className="stat-icon stat-icon-green">
            <Package size={18} />
          </span>
          <p>Total products</p>
          <strong>{totalProducts}</strong>
          <small className="positive">
            <TrendingUp size={12} />
            +2 this month
          </small>
        </article>

        <article className="dashboard-stat-card">
          <span className="stat-icon stat-icon-blue">
            <Package size={18} />
          </span>
          <p>Total quantity</p>
          <strong>{totalQuantity}</strong>
          <small className="positive">
            <TrendingUp size={12} />
            +8 units
          </small>
        </article>

        <article className="dashboard-stat-card">
          <span className="stat-icon stat-icon-gold">
            <CircleDollarSign size={18} />
          </span>
          <p>Inventory value</p>
          <strong>{currency.format(inventoryValue)}</strong>
          <small className="positive">
            <TrendingUp size={12} />
            +{currency.format(Math.max(0, inventoryValue * 0.04))}
          </small>
        </article>

        <article className="dashboard-stat-card">
          <span className="stat-icon stat-icon-red">
            <AlertTriangle size={18} />
          </span>
          <p>Low stock items</p>
          <strong className="danger-value">{lowStockItems}</strong>
          <small className={lowStockItems > 0 ? "negative" : "positive"}>
            <AlertTriangle size={12} />
            {lowStockItems > 0 ? "Needs restock" : "All healthy"}
          </small>
        </article>
      </div>

      <div className="dashboard-command-grid">
        <article className="dashboard-panel stock-level-panel">
          <div className="panel-title-row">
            <h3><LetterHoverText text="Stock levels by product" /></h3>
            <span>{chartProducts.length} products</span>
          </div>

          <div
            className="stock-chart"
            aria-label="Stock levels by product"
            style={{
              gridTemplateColumns: `repeat(${Math.max(
                chartProducts.length,
                1
              )}, minmax(0, 1fr))`,
            }}
          >
            {chartProducts.map((product) => {
              const isCritical = product.quantity <= product.low_stock_limit;
              const isLow =
                !isCritical && product.quantity <= product.low_stock_limit + 5;
              const productLabel = product.sku || product.name;

              return (
                <div className="stock-chart-item" key={product.id || product.name}>
                  <span
                    className={
                      isCritical
                        ? "bar critical"
                        : isLow
                          ? "bar low"
                          : "bar healthy"
                    }
                    style={{
                      height: `${Math.max(
                        18,
                        ((product.quantity || 0) / maxQuantity) * 96
                      )}px`,
                    }}
                    tabIndex={0}
                    role="img"
                    aria-label={`${product.name}: ${product.quantity || 0} units`}
                  >
                    <span className="stock-bar-tooltip" role="tooltip">
                      <strong>{product.name}</strong>
                      <small>{product.sku || "No product code"}</small>
                      <b>{product.quantity || 0} units</b>
                    </span>
                  </span>
                  <small title={`${product.name}${product.sku ? ` (${product.sku})` : ""}`}>
                    {productLabel}
                  </small>
                </div>
              );
            })}
          </div>

          <div className="chart-legend">
            <span>
              <i className="healthy" /> Healthy
            </span>
            <span>
              <i className="low" /> Low
            </span>
            <span>
              <i className="critical" /> Critical
            </span>
          </div>
        </article>

        <article className="dashboard-panel activity-panel">
          <div className="panel-title-row">
            <h3><LetterHoverText text="Recent activity" /></h3>
            <span>Live</span>
          </div>

          <div className="activity-list">
            {activityLoading ? (
              <div className="activity-empty">Loading recent activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="activity-empty">No inventory activity yet.</div>
            ) : (
              recentActivity.map((log) => {
                const activityStyle = getActivityStyle(log);
                const ActivityIcon = activityStyle.icon;

                return (
                  <div
                    className={`activity-item ${activityStyle.className}`}
                    key={log.id}
                  >
                    <ActivityIcon size={16} />
                    <div>
                      <strong>{log.action}</strong>
                      <p>{log.description}</p>
                    </div>
                    <time dateTime={log.created_at} title={new Date(log.created_at).toLocaleString()}>
                      {formatRelativeTime(log.created_at, now)}
                    </time>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="dashboard-panel inventory-panel">
          <div className="panel-title-row">
            <h3><LetterHoverText text="Category overview" /></h3>
            <span>{categorySummary.length} categories</span>
          </div>

          <div className="mini-inventory-table category-summary-table">
            <div className="mini-table-head">
              <span>Category</span>
              <span>Products</span>
              <span>Units</span>
              <span>Value</span>
            </div>

            {categorySummary.length === 0 ? (
              <div className="activity-empty">No category data available.</div>
            ) : (
              categorySummary.map((category) => (
                <div className="mini-table-row" key={category.name}>
                  <span className="category-summary-name">{category.name}</span>
                  <span>{category.products}</span>
                  <span>{category.quantity}</span>
                  <span>{currency.format(category.value)}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="dashboard-panel actions-panel">
          <div className="panel-title-row">
            <h3><LetterHoverText text="Quick actions" /></h3>
          </div>

          <div className="quick-action-list">
            {can("inventory:create") && (
              <Link to="/inventory/add">
                <span className="stat-icon stat-icon-green">
                  <Plus size={17} />
                </span>
                <div>
                  <strong>Add product</strong>
                  <p>Create inventory item</p>
                </div>
                <ArrowRight size={16} />
              </Link>
            )}

            <Link to="/qr-search">
              <span className="stat-icon stat-icon-blue">
                <ScanLine size={17} />
              </span>
              <div>
                <strong>Scan QR / barcode</strong>
                <p>Log item via scanner</p>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link to="/reports">
              <span className="stat-icon stat-icon-gold">
                <FileDown size={17} />
              </span>
              <div>
                <strong>Export report</strong>
                <p>Download inventory data</p>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link to="/notifications">
              <span className="stat-icon stat-icon-red">
                <Bell size={17} />
              </span>
              <div>
                <strong>View alerts</strong>
                <p>{lowStockItems} items need restocking</p>
              </div>
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Dashboard;
