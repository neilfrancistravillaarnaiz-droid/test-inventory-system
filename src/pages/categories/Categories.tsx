import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SuccessModal from "../../components/common/SuccessModal";
import {
  addCategory,
  deleteCategory,
  getCategories,
} from "../../services/categoryService";

type Category = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
  });

  const fetchCategories = async () => {
    const { data, error } = await getCategories();

    if (error) {
      alert(error.message);
      return;
    }

    setCategories(data || []);
  };

  useEffect(() => {
    const loadCategories = async () => {
      await fetchCategories();
    };

    loadCategories();

    const handleRefresh = () => void fetchCategories();
    window.addEventListener("stockflow:refresh-categories", handleRefresh);

    return () =>
      window.removeEventListener("stockflow:refresh-categories", handleRefresh);
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Category name is required.");
      return;
    }

    const { error } = await addCategory({
      name,
      description,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setDescription("");
    fetchCategories();

    setModal({
      show: true,
      title: "Category Added",
      message: "The category was successfully added.",
    });
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const { error } = await deleteCategory(deleteId);

    if (error) {
      alert(error.message);
      return;
    }

    setDeleteId(null);
    setShowDeleteConfirm(false);
    fetchCategories();

    setModal({
      show: true,
      title: "Category Deleted",
      message: "The selected category was successfully deleted.",
    });
  };

  return (
    <section className="category-page">
      <PageHeader
        title="Categories"
        description="Organize products by category."
      />

      <div className="category-layout">
        <form className="category-form" onSubmit={handleAddCategory}>
          <h3>Add New Category</h3>

          <input
            type="text"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button type="submit">Save Category</button>
        </form>

        <div className="category-list">
          <h3>Category List</h3>

          {categories.length === 0 ? (
            <p className="empty-text">No categories found.</p>
          ) : (
            categories.map((category) => (
              <div className="category-item" key={category.id}>
                <div>
                  <h4>{category.name}</h4>
                  <p>{category.description || "No description provided."}</p>
                </div>

                <button
                  type="button"
                  className="danger-btn category-delete-btn"
                  onClick={() => openDeleteModal(category.id)}
                >
                  Delete Category
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <SuccessModal
        show={showDeleteConfirm}
        type="warning"
        title="Delete Category?"
        message="Are you sure you want to delete this category?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
        }}
        onConfirm={confirmDelete}
      />

      <SuccessModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        onClose={() =>
          setModal({
            show: false,
            title: "",
            message: "",
          })
        }
      />
    </section>
  );
};

export default Categories;
