import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SuccessModal from "../../components/common/SuccessModal";
import { useProducts } from "../../hooks/useProducts";
import {
  addStockMovement,
  updateProductQuantity,
} from "../../services/stockService";
import { addAuditLog } from "../../services/auditLogService";

const StockIn = () => {
  const { products, fetchProducts } = useProducts();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedProduct = products.find((item) => item.id === productId);
  const totalStocks = products.reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = products.filter(
    (item) => item.quantity <= item.low_stock_limit
  ).length;

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) return alert("Please select a product.");
    if (quantity <= 0) return alert("Quantity must be greater than zero.");

    const newQuantity = selectedProduct.quantity + quantity;

    const { error: updateError } = await updateProductQuantity(
      selectedProduct.id,
      newQuantity
    );

    if (updateError) return alert(updateError.message);

    const { error: movementError } = await addStockMovement({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      type: "IN",
      quantity,
      note,
    });

    if (movementError) return alert(movementError.message);

    await addAuditLog({
      action: "Stock In",
      module: "Stock",
      description: `${quantity} units added to ${selectedProduct.name}. New quantity: ${newQuantity}.`,
    });

    setProductId("");
    setQuantity(1);
    setNote("");
    fetchProducts();
    setShowSuccess(true);
  };

  return (
    <section className="stock-page">
      <PageHeader
        title="Stock In"
        description="Add incoming stock to your products."
      />

      <div className="stock-summary-grid">
        <div className="stock-mini-card">
          <span>Total Products</span>
          <strong>{products.length}</strong>
        </div>

        <div className="stock-mini-card">
          <span>Total Stocks</span>
          <strong>{totalStocks}</strong>
        </div>

        <div className="stock-mini-card">
          <span>Low Stock Items</span>
          <strong>{lowStock}</strong>
        </div>
      </div>

      <div className="stock-dashboard">
        <div className="stock-form-card">
          <h3>Record Stock In</h3>

          <form className="stock-form" onSubmit={handleStockIn}>
            <div className="form-field">
              <label>Select Product</label>

              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">Choose product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — Current Stock: {product.quantity}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Quantity to Add</label>

              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="form-field">
              <label>Note</label>

              <textarea
                placeholder="Example: New delivery from supplier"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button type="submit">Add Stock</button>
          </form>
        </div>

        <div className="stock-preview-card">
          <h3>Selected Product Preview</h3>

          {selectedProduct ? (
            <>
              <p>
                <strong>Name:</strong> {selectedProduct.name}
              </p>
              <p>
                <strong>Category:</strong> {selectedProduct.category}
              </p>
              <p>
                <strong>Current Stock:</strong> {selectedProduct.quantity}
              </p>
              <p>
                <strong>After Stock In:</strong>{" "}
                {selectedProduct.quantity + quantity}
              </p>
            </>
          ) : (
            <p>Select a product to preview stock changes.</p>
          )}
        </div>
      </div>

      <SuccessModal
        show={showSuccess}
        title="Stock Added"
        message="Incoming stock was recorded successfully."
        onClose={() => setShowSuccess(false)}
      />
    </section>
  );
};

export default StockIn;