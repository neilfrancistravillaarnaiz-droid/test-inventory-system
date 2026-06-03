import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SuccessModal from "../../components/common/SuccessModal";
import { useProducts } from "../../hooks/useProducts";
import {
  addStockMovement,
  updateProductQuantity,
} from "../../services/stockService";
import { addAuditLog } from "../../services/auditLogService";

const StockOut = () => {
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

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert("Please select a product.");
      return;
    }

    if (quantity <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    if (quantity > selectedProduct.quantity) {
      alert("Not enough stock available.");
      return;
    }

    const newQuantity = selectedProduct.quantity - quantity;

    const { error: updateError } = await updateProductQuantity(
      selectedProduct.id,
      newQuantity
    );

    if (updateError) {
      alert(updateError.message);
      return;
    }

    const { error: movementError } = await addStockMovement({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      type: "OUT",
      quantity,
      note,
    });

    if (movementError) {
      alert(movementError.message);
      return;
    }

    await addAuditLog({
      action: "Stock Out",
      module: "Stock",
      description: `${quantity} units removed from ${selectedProduct.name}. New quantity: ${newQuantity}.`,
    });

    setProductId("");
    setQuantity(1);
    setNote("");
    fetchProducts();
    setShowSuccess(true);
  };

  return (
    <section className="stock-page">
      <PageHeader title="Stock Out" description="Remove stocks from inventory." />

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
          <h3>Record Stock Out</h3>

          <form className="stock-form" onSubmit={handleStockOut}>
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
              <label>Quantity to Remove</label>

              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="form-field">
              <label>Reason / Note</label>

              <textarea
                placeholder="Example: Sold item, damaged stock, released item"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button type="submit">Remove Stock</button>
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
                <strong>After Stock Out:</strong>{" "}
                {Math.max(selectedProduct.quantity - quantity, 0)}
              </p>
            </>
          ) : (
            <p>Select a product to preview stock changes.</p>
          )}
        </div>
      </div>

      <SuccessModal
        show={showSuccess}
        title="Stock Removed"
        message="Outgoing stock was recorded successfully."
        onClose={() => setShowSuccess(false)}
      />
    </section>
  );
};

export default StockOut;