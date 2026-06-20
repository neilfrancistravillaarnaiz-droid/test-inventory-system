import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SuccessModal from "../../components/common/SuccessModal";
import {
  addSupplier,
  deleteSupplier,
  getSuppliers,
} from "../../services/supplierService";
import { addAuditLog } from "../../services/auditLogService";

type Supplier = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
  });

  const fetchSuppliers = async () => {
    const { data, error } = await getSuppliers();

    if (error) {
      alert(error.message);
      return;
    }

    setSuppliers(data || []);
  };

  useEffect(() => {
    const loadSuppliers = async () => {
      await fetchSuppliers();
    };

    loadSuppliers();

    const handleRefresh = () => void fetchSuppliers();
    window.addEventListener("stockflow:refresh-suppliers", handleRefresh);

    return () =>
      window.removeEventListener("stockflow:refresh-suppliers", handleRefresh);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Supplier name is required.");
      return;
    }

    const { error } = await addSupplier(form);

    if (error) {
      alert(error.message);
      return;
    }

    await addAuditLog({
      action: "Supplier Added",
      module: "Suppliers",
      description: `${form.name} was added as a supplier.`,
    });

    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
    });

    await fetchSuppliers();

    setModal({
      show: true,
      title: "Supplier Added",
      message: "The supplier was successfully added.",
    });
  };

  const openDeleteModal = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const supplierName = deleteName;

    const { error } = await deleteSupplier(deleteId);

    if (error) {
      alert(error.message);
      return;
    }

    await addAuditLog({
      action: "Supplier Deleted",
      module: "Suppliers",
      description: `${supplierName} was removed from supplier records.`,
    });

    setDeleteId(null);
    setDeleteName("");
    setShowDeleteConfirm(false);

    await fetchSuppliers();

    setModal({
      show: true,
      title: "Supplier Deleted",
      message: "The selected supplier was successfully deleted.",
    });
  };

  return (
    <section className="supplier-page">
      <PageHeader
        title="Suppliers"
        description="Manage product suppliers and contact information."
      />

      <div className="supplier-layout">
        <form className="supplier-form" onSubmit={handleAddSupplier}>
          <h3>Add New Supplier</h3>

          <input
            name="name"
            type="text"
            placeholder="Supplier name"
            value={form.name}
            onChange={handleChange}
          />

          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
          />

          <input
            name="phone"
            type="text"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
          />

          <textarea
            name="address"
            placeholder="Supplier address"
            value={form.address}
            onChange={handleChange}
          />

          <button type="submit">Save Supplier</button>
        </form>

        <div className="supplier-list">
          <h3>Supplier List</h3>

          {suppliers.length === 0 ? (
            <p className="empty-text">No suppliers found.</p>
          ) : (
            suppliers.map((supplier) => (
              <div className="supplier-item" key={supplier.id}>
                <div>
                  <h4>{supplier.name}</h4>
                  <p>Email: {supplier.email || "N/A"}</p>
                  <p>Phone: {supplier.phone || "N/A"}</p>
                  <p>Address: {supplier.address || "N/A"}</p>
                </div>

                <button
                  type="button"
                  className="danger-btn category-delete-btn"
                  onClick={() => openDeleteModal(supplier.id, supplier.name)}
                >
                  Delete Supplier
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <SuccessModal
        show={showDeleteConfirm}
        type="warning"
        title="Delete Supplier?"
        message={`Are you sure you want to delete ${
          deleteName || "this supplier"
        }?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
          setDeleteName("");
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

export default Suppliers;
