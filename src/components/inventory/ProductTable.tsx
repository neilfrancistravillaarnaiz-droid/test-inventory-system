import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../../types/Product";
import { deleteBackendProduct } from "../../services/backendProductService";
import SuccessModal from "../common/SuccessModal";

type Props = {
  products: Product[];
  refresh?: () => void;
};

const ProductTable = ({ products, refresh }: Props) => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = (id: string) => {
    setSelectedProductId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (!selectedProductId) return;

      setDeleting(true);

      await deleteBackendProduct(selectedProductId);

      setShowDeleteConfirm(false);
      setSelectedProductId(null);
      setShowDeletedModal(true);

      refresh?.();
    } catch (error) {
      console.error(error);
      alert("Failed to delete product. Please check your backend connection.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="table-card inventory-table-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU Code</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Location</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Stock Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-cell">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td data-label="Product Name">
                    <Link
                      to={`/products/${product.id}`}
                      className="inventory-product"
                    >
                      <img
                        src={
                          product.image_url ||
                          `https://picsum.photos/seed/${encodeURIComponent(
                            product.id
                          )}/120/120`
                        }
                        alt={product.name}
                        loading="lazy"
                      />

                      <div className="inventory-product-info">
                        <span>{product.name}</span>
                        <small>{product.category}</small>
                      </div>
                    </Link>
                  </td>

                  <td data-label="SKU Code">{product.sku || "—"}</td>
                  <td data-label="Category">{product.category}</td>
                  <td data-label="Supplier">{product.supplier || "—"}</td>

                  <td data-label="Location">
                    {product.warehouse ||
                    product.shelf ||
                    product.rack ||
                    product.bin ? (
                      <span className="location-pill">
                        {product.warehouse || "N/A"} /{" "}
                        {product.shelf || "N/A"} /{" "}
                        {product.rack || "N/A"} / {product.bin || "N/A"}
                      </span>
                    ) : (
                      "Not assigned"
                    )}
                  </td>

                  <td data-label="Quantity">{product.quantity}</td>

                  <td data-label="Unit Price">
                    ₱{Number(product.price).toFixed(2)}
                  </td>

                  <td data-label="Stock Status">
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

                  <td data-label="Actions">
                    <div className="table-actions">
                      <Link
                        className="edit-btn"
                        to={`/inventory/edit/${product.id}`}
                      >
                        Edit Product
                      </Link>

                      <button
                        className="danger-btn"
                        onClick={() => openDeleteModal(product.id)}
                        disabled={deleting}
                      >
                        {deleting && selectedProductId === product.id
                          ? "Deleting..."
                          : "Delete Product"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SuccessModal
        show={showDeleteConfirm}
        type="warning"
        title="Delete Product?"
        message={
          deleting
            ? "Deleting product, please wait..."
            : "Are you sure you want to delete this product? This action cannot be undone."
        }
        confirmText={deleting ? "Deleting..." : "Yes, Delete"}
        cancelText="Cancel"
        onClose={() => {
          if (deleting) return;
          setShowDeleteConfirm(false);
          setSelectedProductId(null);
        }}
        onConfirm={confirmDelete}
      />

      <SuccessModal
        show={showDeletedModal}
        title="Product Deleted"
        message="The selected product was successfully removed through your backend API."
        confirmText="Okay"
        onClose={() => setShowDeletedModal(false)}
      />
    </>
  );
};

export default ProductTable;