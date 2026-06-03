import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import ProductForm from "../../components/inventory/ProductForm";
import SuccessModal from "../../components/common/SuccessModal";
import { addProduct } from "../../services/inventoryService";
import { addAuditLog } from "../../services/auditLogService";
import type { ProductInput } from "../../types/Product";

const AddProduct = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddProduct = async (product: ProductInput) => {
    const { error } = await addProduct(product);

    if (error) {
      alert(error.message);
      return;
    }

    await addAuditLog({
      action: "Product Added",
      module: "Inventory",
      description: `${product.name} was added to the inventory.`,
    });

    setShowSuccess(true);
  };

  return (
    <section className="add-product-page">
      <div className="add-product-header">
        <PageHeader
          title="Add Product"
          description="Create a new product record for your inventory."
        />

        <Link to="/inventory" className="back-link">
          ← Back to Inventory
        </Link>
      </div>

      <div className="add-product-card">
        <div className="form-info">
          <span className="form-badge">New Item</span>
          <h3>Product Information</h3>
          <p>
            Fill in the details below. Make sure the quantity, price, image, and
            stock limit are correct before saving.
          </p>
        </div>

        <ProductForm onSubmit={handleAddProduct} />
      </div>

      <SuccessModal
        show={showSuccess}
        title="Product Added"
        message="The product, including its image if selected, was successfully added to your inventory."
        onClose={() => navigate("/inventory")}
      />
    </section>
  );
};

export default AddProduct;