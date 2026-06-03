import { useState } from "react";
import { uploadProductImage } from "../../services/storageService";
import type { ProductInput } from "../../types/Product";

type ProductFormProps = {
  onSubmit: (product: ProductInput) => Promise<void>;
};

const ProductForm = ({ onSubmit }: ProductFormProps) => {
  const [form, setForm] = useState<ProductInput>({
    name: "",
    sku: "",
    category: "",
    supplier: "",
    quantity: 0,
    price: 0,
    low_stock_limit: 5,
    image_url: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]:
        name === "quantity" ||
        name === "price" ||
        name === "low_stock_limit"
          ? Number(value)
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = "";

    if (imageFile) {
      const {
        imageUrl: uploadedUrl,
        error,
      } = await uploadProductImage(imageFile);

      if (error) {
        alert(error.message);
        return;
      }

      imageUrl = uploadedUrl || "";
    }

    await onSubmit({
      ...form,
      image_url: imageUrl,
    });
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <input
        name="name"
        placeholder="Product Name"
        value={form.name}
        onChange={handleChange}
      />

      <input
        name="sku"
        placeholder="SKU"
        value={form.sku}
        onChange={handleChange}
      />

      <input
        name="category"
        placeholder="Category"
        value={form.category}
        onChange={handleChange}
      />

      <input
        name="supplier"
        placeholder="Supplier"
        value={form.supplier}
        onChange={handleChange}
      />

      <input
        name="quantity"
        type="number"
        placeholder="Quantity"
        value={form.quantity}
        onChange={handleChange}
      />

      <input
        name="price"
        type="number"
        placeholder="Price"
        value={form.price}
        onChange={handleChange}
      />

      <input
        name="low_stock_limit"
        type="number"
        placeholder="Low Stock Limit"
        value={form.low_stock_limit}
        onChange={handleChange}
      />

      <div className="form-field">
        <label>Product Image</label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setImageFile(
              e.target.files?.[0] || null
            )
          }
        />
      </div>

      <button type="submit">
        Save Product
      </button>
    </form>
  );
};

export default ProductForm;