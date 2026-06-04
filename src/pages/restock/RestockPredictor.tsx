import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { useProducts } from "../../hooks/useProducts";
import { getStockMovements } from "../../services/stockService";

type StockMovement = {
  id: string;
  product_id: string;
  product_name: string;
  type: "IN" | "OUT";
  quantity: number;
  note: string | null;
  created_at: string;
};

const RestockPredictor = () => {
  const { products, loading } = useProducts();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementLoading, setMovementLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      const { data, error } = await getStockMovements();

      if (error) {
        alert(error.message);
        setMovementLoading(false);
        return;
      }

      setMovements(data || []);
      setMovementLoading(false);
    };

    fetchMovements();
  }, []);

  if (loading || movementLoading) {
    return <div className="loader">Loading restock predictions...</div>;
  }

  if (products.length === 0) {
    return (
      <section className="restock-page">
        <PageHeader
          title="Smart Restock Predictor"
          description="Automatically recommend restock quantities."
        />

        <div className="content-card">
          No products found. Add products first before using the predictor.
        </div>
      </section>
    );
  }

  const predictions = products
    .map((product) => {
      const stockOutHistory = movements.filter(
        (movement) =>
          movement.product_id === product.id && movement.type === "OUT"
      );

      const totalStockOut = stockOutHistory.reduce(
        (sum, movement) => sum + Number(movement.quantity),
        0
      );

      const averageDemand =
        stockOutHistory.length > 0
          ? Math.ceil(totalStockOut / stockOutHistory.length)
          : Number(product.low_stock_limit || 5);

      const quantity = Number(product.quantity || 0);
      const lowStockLimit = Number(product.low_stock_limit || 5);

      const urgency =
        quantity <= 0
          ? "Critical"
          : quantity <= lowStockLimit
          ? "High"
          : quantity <= lowStockLimit * 2
          ? "Medium"
          : "Low";

      const recommendedRestock =
        urgency === "Low"
          ? 0
          : Math.max(lowStockLimit * 2 - quantity, averageDemand);

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        quantity,
        lowStockLimit,
        totalStockOut,
        averageDemand,
        recommendedRestock,
        urgency,
      };
    })
    .sort((a, b) => {
      const order: Record<string, number> = {
        Critical: 1,
        High: 2,
        Medium: 3,
        Low: 4,
      };

      return order[a.urgency] - order[b.urgency];
    });

  return (
    <section className="restock-page">
      <PageHeader
        title="Smart Restock Predictor"
        description="Automatically recommend restock quantities based on stock levels and stock-out history."
      />

      <div className="restock-grid">
        {predictions.map((product) => (
          <div
            className={`restock-card urgency-${product.urgency.toLowerCase()}`}
            key={product.id}
          >
            <div className="restock-card-header">
              <div>
                <h3>{product.name}</h3>
                <p>{product.category}</p>
              </div>

              <span>{product.urgency}</span>
            </div>

            <div className="restock-metrics">
              <div>
                <small>Current Stock</small>
                <strong>{product.quantity}</strong>
              </div>

              <div>
                <small>Low Stock Limit</small>
                <strong>{product.lowStockLimit}</strong>
              </div>

              <div>
                <small>Total Stock Out</small>
                <strong>{product.totalStockOut}</strong>
              </div>

              <div>
                <small>Average Demand</small>
                <strong>{product.averageDemand}</strong>
              </div>
            </div>

            <div className="restock-recommendation">
              <span>Recommended Restock</span>
              <strong>
                {product.recommendedRestock > 0
                  ? `+${product.recommendedRestock} units`
                  : "No restock needed"}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RestockPredictor;