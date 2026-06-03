import type { Product } from "../../types/Product";

type Props = {
  products: Product[];
};

const InventoryStats = ({ products }: Props) => {
  const totalProducts = products.length;

  const totalQuantity = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const lowStock = products.filter(
    (product) => product.quantity <= product.low_stock_limit
  ).length;

  return (
    <div className="card-grid">
      <div className="dashboard-card">
        <p>Total Products</p>
        <h3>{totalProducts}</h3>
      </div>

      <div className="dashboard-card">
        <p>Total Stocks</p>
        <h3>{totalQuantity}</h3>
      </div>

      <div className="dashboard-card">
        <p>Low Stocks</p>
        <h3>{lowStock}</h3>
      </div>
    </div>
  );
};

export default InventoryStats;