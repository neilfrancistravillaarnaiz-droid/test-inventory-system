import PageHeader from "../../components/common/PageHeader";
import { useProducts } from "../../hooks/useProducts";

const Reports = () => {
  const { products, loading } = useProducts();

  const totalProducts = products.length;
  const totalStocks = products.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryValue = products.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const lowStockProducts = products.filter(
    (item) => item.quantity <= item.low_stock_limit
  );

  const exportCSV = () => {
    const headers = [
      "Product Name",
      "Category",
      "Supplier",
      "Quantity",
      "Price",
      "Low Stock Limit",
      "Status",
    ];

    const rows = products.map((product) => [
      product.name,
      product.category,
      product.supplier || "N/A",
      product.quantity,
      product.price,
      product.low_stock_limit,
      product.quantity <= product.low_stock_limit ? "Low Stock" : "Available",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "inventory-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return <div className="loader">Loading reports...</div>;
  }

  return (
    <section className="reports-page">
      <div className="report-header-row">
        <PageHeader
          title="Reports"
          description="View, print, and export inventory reports."
        />

        <div className="report-actions">
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={printReport}>Print Report</button>
        </div>
      </div>

      <div className="report-summary-grid">
        <div className="report-card">
          <span>Total Products</span>
          <strong>{totalProducts}</strong>
        </div>

        <div className="report-card">
          <span>Total Stocks</span>
          <strong>{totalStocks}</strong>
        </div>

        <div className="report-card">
          <span>Inventory Value</span>
          <strong>₱{inventoryValue.toFixed(2)}</strong>
        </div>

        <div className="report-card warning">
          <span>Low Stock Items</span>
          <strong>{lowStockProducts.length}</strong>
        </div>
      </div>

      <div className="report-section">
        <h3>Inventory Report</h3>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No products available.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.supplier || "—"}</td>
                    <td>{product.quantity}</td>
                    <td>₱{Number(product.price).toFixed(2)}</td>
                    <td>
                      ₱{Number(product.quantity * product.price).toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={
                          product.quantity <= product.low_stock_limit
                            ? "badge danger"
                            : "badge success"
                        }
                      >
                        {product.quantity <= product.low_stock_limit
                          ? "Low Stock"
                          : "Available"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Reports;