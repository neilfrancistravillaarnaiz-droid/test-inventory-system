import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import ProductForm from "../../components/inventory/ProductForm";
import { getProductById, updateProduct } from "../../services/inventoryService";
import type { ProductInput } from "../../types/Product";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<any>(null);
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

      setInitialData(data);
      setLoading(false);
    };

    fetchProduct();
  }, [id, navigate]);

  const handleUpdate = async (product: ProductInput) => {
    if (!id) return false;

    const { error } = await updateProduct(id, product);

    if (error) {
      alert(error.message);
      return false;
    }

    alert("Product updated successfully!");
    navigate("/inventory");
    return true;
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
        </div>

        <ProductForm onSubmit={handleUpdate} initialData={initialData} />
      </div>
    </section>
  );
};

export default EditProduct;
