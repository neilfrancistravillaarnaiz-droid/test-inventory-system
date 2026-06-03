import PageHeader from "../../components/common/PageHeader";

const Dashboard = () => {
  return (
    <section>
      <PageHeader
        title="Dashboard"
        description="Welcome to your inventory system."
      />

      <div className="card-grid">
        <div className="dashboard-card">
          <p>Total Products</p>
          <h3>0</h3>
        </div>

        <div className="dashboard-card">
          <p>Total Quantity</p>
          <h3>0</h3>
        </div>

        <div className="dashboard-card">
          <p>Inventory Value</p>
          <h3>₱0.00</h3>
        </div>

        <div className="dashboard-card">
          <p>Low Stock Items</p>
          <h3>0</h3>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;