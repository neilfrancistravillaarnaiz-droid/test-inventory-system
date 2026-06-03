import type { Product } from "../../types/Product";
import { deleteProduct } from "../../services/inventoryService";

type InventoryTableProps = {
  products: Product[];
  refresh: () => void;
};

const InventoryTable = ({ products, refresh }: InventoryTableProps) => {
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await deleteProduct(id);

    if (error) {
      alert(error.message);
      return;
    }

    refresh();
  };

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Supplier</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={9} className="empty-cell">No products available.</td>
            </tr>
          ) : (
            products.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.sku || "—"}</td>
                <td>{item.category}</td>
                <td>{item.supplier || "—"}</td>
                <td>{item.quantity}</td>
                <td>₱{Number(item.price).toFixed(2)}</td>
                <td>₱{Number(item.quantity * item.price).toFixed(2)}</td>
                <td>
                  <span className={item.quantity <= item.low_stock_limit ? "badge danger" : "badge success"}>
                    {item.quantity <= item.low_stock_limit ? "Low Stock" : "Available"}
                  </span>
                </td>
                <td>
                  <button className="danger-btn" onClick={() => handleDelete(item.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;