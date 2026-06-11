import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import ProductForm from "../../components/inventory/ProductForm";

import {
  getBackendProductById,
  updateBackendProduct,
} from "../../services/backendProductService";

import { addAuditLog } from "../../services/auditLogService";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;

        const product = await getBackendProductById(id);

        setInitialData(product);
      } catch (error) {
        console.error(error);
        alert("Failed to load product.");
        navigate("/inventory");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const handleUpdate = async (product: {
    name: string;
    sku: string;
    category: string;
    supplier: string;
    quantity: number;
    price: number;
    low_stock_limit: number;
  }) => {
    try {
      if (!id) return;

      setSaving(true);

      await updateBackendProduct(id, product);

      await addAuditLog({
        action: "Product Updated",
        module: "Inventory",
        description: `${product.name} was updated.`,
      });

      alert("Product updated successfully!");
      navigate("/inventory");
    } catch (error) {
      console.error(error);
      alert("Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loader">Loading product...</div>;
  }

  return (
    <section className="add-product-page">
      <div className="add-product-header">
        <PageHeader
          title="Edit Product"
          description="Update the selected product information."
        />

        <Link to="/inventory" className="back-link">
          ← Back to Inventory
        </Link>
      </div>

      <div className="add-product-card">
        <div className="form-info">
          <span className="form-badge">Update Item</span>

          <h3>Edit Product Details</h3>

          <p>
            Review the existing details and update the product information as
            needed.
          </p>

          {saving && (
            <p className="saving-text">
              Updating product...
            </p>
          )}
        </div>

        <ProductForm
          onSubmit={handleUpdate}
          initialData={initialData}
        />
      </div>
    </section>
  );
};

export default EditProduct;