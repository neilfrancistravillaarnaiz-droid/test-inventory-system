import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CircleDollarSign,
  FileDown,
  Package,
  Plus,
  ScanLine,
  TrendingUp,
} from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { useCurrentProfile } from "../../hooks/useCurrentProfile";
import LetterHoverText from "../../components/common/LetterHoverText";

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const Dashboard = () => {
  const { products, loading } = useProducts();
  const { can } = useCurrentProfile();

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
  const tableProducts = products.slice(0, 5);
  const maxQuantity = Math.max(
    1,
    ...chartProducts.map((product) => product.quantity || 0)
  );

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

          <div className="stock-chart" aria-label="Stock levels by product">
            {chartProducts.map((product, index) => {
              const isCritical = product.quantity <= product.low_stock_limit;
              const isLow =
                !isCritical && product.quantity <= product.low_stock_limit + 5;

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
                  />
                  <small>{String.fromCharCode(65 + index)}</small>
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
            <div className="activity-item success">
              <Plus size={16} />
              <div>
                <strong>Product restocked</strong>
                <p>+20 units added</p>
              </div>
              <time>2m</time>
            </div>

            <div className="activity-item danger">
              <AlertTriangle size={16} />
              <div>
                <strong>Low stock alert</strong>
                <p>{lowStockProducts[0]?.name || "No product"} needs review</p>
              </div>
              <time>14m</time>
            </div>

            <div className="activity-item blue">
              <ScanLine size={16} />
              <div>
                <strong>QR scan logged</strong>
                <p>Warehouse B</p>
              </div>
              <time>1h</time>
            </div>

            <div className="activity-item gold">
              <FileDown size={16} />
              <div>
                <strong>Report exported</strong>
                <p>June monthly</p>
              </div>
              <time>3h</time>
            </div>
          </div>
        </article>

        <article className="dashboard-panel inventory-panel">
          <div className="panel-title-row">
            <h3><LetterHoverText text="Inventory table" /></h3>
            <span>{lowStockItems} need attention</span>
          </div>

          <div className="mini-inventory-table">
            <div className="mini-table-head">
              <span>Product</span>
              <span>Qty</span>
              <span>Level</span>
              <span>Status</span>
            </div>

            {tableProducts.map((product) => {
              const isCritical = product.quantity <= product.low_stock_limit;
              const isLow =
                !isCritical && product.quantity <= product.low_stock_limit + 5;

              return (
                <div className="mini-table-row" key={product.id || product.name}>
                  <span>{product.name}</span>
                  <span>{product.quantity}</span>
                  <span>
                    <i
                      className={isCritical ? "critical" : isLow ? "low" : "ok"}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(10, ((product.quantity || 0) / maxQuantity) * 100)
                        )}%`,
                      }}
                    />
                  </span>
                  <span
                    className={
                      isCritical
                        ? "mini-status critical"
                        : isLow
                          ? "mini-status low"
                          : "mini-status ok"
                    }
                  >
                    {isCritical ? "Critical" : isLow ? "Low" : "OK"}
                  </span>
                </div>
              );
            })}
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
