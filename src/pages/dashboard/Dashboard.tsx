import PageHeader from "../../components/common/PageHeader";
import { useProducts } from "../../hooks/useProducts";

const Dashboard = () => {
  const { products, loading } = useProducts();

  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, product) => sum + (product.quantity || 0), 0);
  const inventoryValue = products.reduce(
    (sum, product) => sum + (product.quantity || 0) * (product.price || 0),
    0
  );
  const lowStockItems = products.filter(
    (product) => product.quantity <= product.low_stock_limit
  ).length;

  if (loading) {
    return <div className="loader">Loading dashboard...</div>;
  }

  return (
    <section>
      <PageHeader
        title="Dashboard"
        description="Welcome to your inventory system."
      />

      <div className="card-grid">
        <div className="dashboard-card">
          <p>Total Products</p>
          <h3>{totalProducts}</h3>
        </div>

        <div className="dashboard-card">
          <p>Total Quantity</p>
          <h3>{totalQuantity}</h3>
        </div>

        <div className="dashboard-card">
          <p>Inventory Value</p>
          <h3>₱{inventoryValue.toFixed(2)}</h3>
        </div>

        <div className="dashboard-card">
          <p>Low Stock Items</p>
          <h3>{lowStockItems}</h3>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;