import { useEffect, useState } from "react";
import { getCategories } from "../../services/categoryService";
import { getSuppliers } from "../../services/supplierService";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  deleteStoredImage,
  uploadProductImage,
} from "../../services/storageService";

type ProductData = {
  name: string;
  sku: string;
  category: string;
  supplier: string;
  quantity: number;
  price: number;
  low_stock_limit: number;
  image_url?: string;
  warehouse?: string;
  shelf?: string;
  rack?: string;
  bin?: string;
};

type ProductFormProps = {
  onSubmit: (product: ProductData) => Promise<boolean>;
  initialData?: ProductData | null;
};

type Category = {
  id: string;
  name: string;
};

type Supplier = {
  id: string;
  name: string;
};

const productNameOptions = [
  "Keyboard",
  "Mouse",
  "Monitor",
  "Laptop",
  "Printer",
  "Router",
  "Headset",
  "USB Flash Drive",
];

const getDefaultForm = (initialData?: ProductData | null): ProductData => ({
  name: initialData?.name || "",
  sku: initialData?.sku || "",
  category: initialData?.category || "",
  supplier: initialData?.supplier || "",
  quantity: initialData?.quantity || 0,
  price: initialData?.price || 0,
  low_stock_limit: initialData?.low_stock_limit || 5,
  image_url: initialData?.image_url || "",
  warehouse: initialData?.warehouse || "",
  shelf: initialData?.shelf || "",
  rack: initialData?.rack || "",
  bin: initialData?.bin || "",
});

const ProductForm = ({ onSubmit, initialData }: ProductFormProps) => {
  const [form, setForm] = useState<ProductData>(() =>
    getDefaultForm(initialData)
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initialData?.image_url || "");
  const [removeImage, setRemoveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDropdowns = async () => {
      const { data: categoryData } = await getCategories();
      const { data: supplierData } = await getSuppliers();

      setCategories(categoryData || []);
      setSuppliers(supplierData || []);
    };

    fetchDropdowns();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      alert("Please choose an image file that is 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "price" || name === "low_stock_limit"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.category || !form.supplier) {
      alert("Product name, category, and supplier are required.");
      return;
    }

    setSubmitting(true);
    let nextImageUrl = removeImage ? "" : form.image_url || "";
    let uploadedImageUrl = "";

    if (imageFile) {
      const { imageUrl, error } = await uploadProductImage(imageFile);

      if (error || !imageUrl) {
        setSubmitting(false);
        alert(error?.message || "Unable to upload the product image.");
        return;
      }

      nextImageUrl = imageUrl;
      uploadedImageUrl = imageUrl;
    }

    const saved = await onSubmit({ ...form, image_url: nextImageUrl });

    if (!saved && uploadedImageUrl) {
      await deleteStoredImage(uploadedImageUrl);
    }

    if (
      saved &&
      initialData?.image_url &&
      initialData.image_url !== nextImageUrl
    ) {
      await deleteStoredImage(initialData.image_url);
    }

    setSubmitting(false);
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label>Product Name</label>
        <input
          list="product-name-options"
          name="name"
          placeholder="Select or type product name"
          value={form.name}
          onChange={handleChange}
        />

        <datalist id="product-name-options">
          {productNameOptions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>

      <div className="form-field full-field product-image-field">
        <label>Product Image</label>
        <div className="media-upload-control">
          <div className="media-preview product-media-preview">
            {imagePreview ? (
              <img src={imagePreview} alt="Product preview" />
            ) : (
              <ImagePlus size={28} aria-hidden="true" />
            )}
          </div>

          <div className="media-upload-actions">
            <label className="media-upload-button">
              <ImagePlus size={17} aria-hidden="true" />
              {imagePreview ? "Change Image" : "Add Image"}
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>

            {imagePreview && (
              <button
                type="button"
                className="media-remove-button"
                onClick={handleRemoveImage}
              >
                <Trash2 size={17} aria-hidden="true" />
                Remove
              </button>
            )}
            <small>JPG, PNG, or WebP. Maximum 5 MB.</small>
          </div>
        </div>
      </div>

      <div className="form-field">
        <label>SKU Code</label>
        <input
          name="sku"
          placeholder="Example: PRD-001"
          value={form.sku}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label>Category</label>
        <select name="category" value={form.category} onChange={handleChange}>
          <option value="">Select category</option>
          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label>Supplier</label>
        <select name="supplier" value={form.supplier} onChange={handleChange}>
          <option value="">Select supplier</option>
          {suppliers.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label>Quantity</label>
        <input
          name="quantity"
          type="number"
          placeholder="Enter quantity"
          value={form.quantity}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label>Unit Price</label>
        <input
          name="price"
          type="number"
          placeholder="Enter unit price"
          value={form.price}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label>Low Stock Limit</label>
        <input
          name="low_stock_limit"
          type="number"
          placeholder="Enter low stock limit"
          value={form.low_stock_limit}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label>Warehouse</label>
        <input
          name="warehouse"
          placeholder="Example: Warehouse A"
          value={form.warehouse || ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label>Shelf</label>
        <input
          name="shelf"
          placeholder="Example: Shelf B-12"
          value={form.shelf || ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label>Rack</label>
        <input
          name="rack"
          placeholder="Example: Rack C-05"
          value={form.rack || ""}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label>Bin</label>
        <input
          name="bin"
          placeholder="Example: Bin 08"
          value={form.bin || ""}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="save-product-btn" disabled={submitting}>
        {submitting ? "Saving Product..." : "Save Product Record"}
      </button>
    </form>
  );
};

export default ProductForm;
