import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import DashboardCard from "../../components/dashboard/DashboardCard";
import { useProducts } from "../../hooks/useProducts";
import { getAuditLogs } from "../../services/auditLogService";

type AuditLog = {
  id: string;
  action: string;
  module: string;
  description: string;
  created_at: string;
};

const Dashboard = () => {
  const { products, loading } = useProducts();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await getAuditLogs();
      setLogs(data || []);
    };

    fetchLogs();
  }, []);

  const totalProducts = products.length;
  const totalStocks = products.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryValue = products.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const lowStockProducts = products.filter(
    (item) => item.quantity <= item.low_stock_limit
  );

  const recentLogs = logs.slice(0, 5);

  if (loading) {
    return <div className="loader">Loading dashboard...</div>;
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <PageHeader
            title="Dashboard"
            description="Monitor your inventory performance and recent activities."
          />
        </div>

        <div className="quick-actions">
          <Link to="/inventory/add">Add Product</Link>
          <Link to="/stock-in">Stock In</Link>
          <Link to="/stock-out">Stock Out</Link>
          <Link to="/reports">Reports</Link>
        </div>
      </div>

      <div className="card-grid">
        <DashboardCard title="Total Products" value={totalProducts} />
        <DashboardCard title="Total Stocks" value={totalStocks} />
        <DashboardCard
          title="Inventory Value"
          value={`₱${inventoryValue.toFixed(2)}`}
        />
        <DashboardCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          note="Needs attention"
        />
      </div>

      <div className="dashboard-insights">
        <div className="insight-panel">
          <div className="section-header">
            <h3>Low Stock Highlights</h3>
            <p>Products that need restocking soon.</p>
          </div>

          <div className="insight-list">
            {lowStockProducts.length === 0 ? (
              <div className="empty-insight">No low stock products.</div>
            ) : (
              lowStockProducts.slice(0, 5).map((product) => (
                <div className="insight-item" key={product.id}>
                  <div>
                    <h4>{product.name}</h4>
                    <p>{product.category}</p>
                  </div>

                  <span className="badge danger">
                    {product.quantity} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="insight-panel">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <p>Latest actions recorded in audit logs.</p>
          </div>

          <div className="insight-list">
            {recentLogs.length === 0 ? (
              <div className="empty-insight">No recent activity yet.</div>
            ) : (
              recentLogs.map((log) => (
                <div className="insight-item" key={log.id}>
                  <div>
                    <h4>{log.action}</h4>
                    <p>{log.description}</p>
                  </div>

                  <small>{new Date(log.created_at).toLocaleDateString()}</small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;