import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
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

const StockHistory = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const fetchMovements = async () => {
    const { data, error } = await getStockMovements();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setMovements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const filteredMovements = movements.filter((item) => {
    const matchesSearch =
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.note?.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === "ALL" || item.type === filterType;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="loader">Loading stock history...</div>;
  }

  return (
    <section className="stock-page">
      <PageHeader
        title="Stock History"
        description="View and monitor all stock movement records."
      />

      <div className="history-tools">
        <input
          type="text"
          placeholder="Search product or note..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="ALL">All Movements</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
        </select>
      </div>

      <div className="history-grid">
        {filteredMovements.length === 0 ? (
          <div className="content-card">No stock movements found.</div>
        ) : (
          filteredMovements.map((item) => (
            <div className="history-card" key={item.id}>
              <div>
                <span className={item.type === "IN" ? "badge success" : "badge danger"}>
                  {item.type === "IN" ? "Stock In" : "Stock Out"}
                </span>

                <h3>{item.product_name}</h3>
                <p>{item.note || "No note provided."}</p>
              </div>

              <div className="history-meta">
                <strong>{item.quantity}</strong>
                <small>{new Date(item.created_at).toLocaleString()}</small>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default StockHistory;