import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import type { Product } from "../../types/Product";
import { getProductById } from "../../services/inventoryService";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      const { data, error } = await getProductById(id);

      if (error) {
        alert(error.message);
        navigate("/inventory");
        return;
      }

      setProduct(data);
      setLoading(false);
    };

    fetchProduct();
  }, [id, navigate]);

  if (loading) {
    return <div className="loader">Loading product details...</div>;
  }

  if (!product) {
    return <div className="content-card">Product not found.</div>;
  }

  const totalValue = product.quantity * product.price;
  const isLowStock = product.quantity <= product.low_stock_limit;

  return (
    <section className="product-details-page">
      <div className="product-details-header">
        <PageHeader
          title="Product Details"
          description="View complete product information and quick actions."
        />

        <Link to="/inventory" className="back-link">
          ← Back to Inventory
        </Link>
      </div>

      <div className="product-details-layout">
        <div className="product-image-card">
          <img
            src={
              product.image_url ||
              "https://via.placeholder.com/420?text=No+Image"
            }
            alt={product.name}
          />

          <span className={isLowStock ? "badge danger" : "badge success"}>
            {isLowStock ? "Low Stock" : "Available"}
          </span>
        </div>

        <div className="product-info-card">
          <h2>{product.name}</h2>
          <p>{product.sku || "No SKU code"}</p>

          <div className="product-info-grid">
            <div>
              <span>Category</span>
              <strong>{product.category}</strong>
            </div>

            <div>
              <span>Supplier</span>
              <strong>{product.supplier || "N/A"}</strong>
            </div>

            <div>
              <span>Quantity</span>
              <strong>{product.quantity}</strong>
            </div>

            <div>
              <span>Unit Price</span>
              <strong>
                ₱{Number(product.price).toFixed(2)}
              </strong>
            </div>

            <div>
              <span>Total Value</span>
              <strong>
                ₱{Number(totalValue).toFixed(2)}
              </strong>
            </div>

            <div>
              <span>Low Stock Limit</span>
              <strong>{product.low_stock_limit}</strong>
            </div>

            {/* LOCATION MAPPING */}

            <div>
              <span>Warehouse</span>
              <strong>
                {product.warehouse || "Not Assigned"}
              </strong>
            </div>

            <div>
              <span>Shelf</span>
              <strong>
                {product.shelf || "Not Assigned"}
              </strong>
            </div>

            <div>
              <span>Rack</span>
              <strong>
                {product.rack || "Not Assigned"}
              </strong>
            </div>

            <div>
              <span>Bin</span>
              <strong>
                {product.bin || "Not Assigned"}
              </strong>
            </div>
          </div>

          {/* LOCATION CARD */}

          <div className="product-location-card">
            <h3>📍 Product Location</h3>

            <p>
              <strong>Warehouse:</strong>{" "}
              {product.warehouse || "Not Assigned"}
            </p>

            <p>
              <strong>Shelf:</strong>{" "}
              {product.shelf || "Not Assigned"}
            </p>

            <p>
              <strong>Rack:</strong>{" "}
              {product.rack || "Not Assigned"}
            </p>

            <p>
              <strong>Bin:</strong>{" "}
              {product.bin || "Not Assigned"}
            </p>
          </div>

          <div className="product-detail-actions">
            <Link to={`/inventory/edit/${product.id}`}>
              Edit Product
            </Link>

            <Link to="/stock-in">
              Stock In
            </Link>

            <Link to="/stock-out">
              Stock Out
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetails;