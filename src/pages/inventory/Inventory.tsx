import { useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import ProductTable from "../../components/inventory/ProductTable";
import SearchBar from "../../components/inventory/SearchBar";
import InventoryStats from "../../components/inventory/InventoryStats";

const Inventory = () => {
  const { products, loading, fetchProducts } = useProducts();
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="loader">Loading products...</div>;
  }

  return (
    <section className="inventory-page">
      <div className="page-row inventory-header-row">
        <div className="page-header">
          <h2>Inventory</h2>
          <p>Manage all products.</p>
        </div>

        <Link className="primary-link add-btn" to="/inventory/add">
          Add Product
        </Link>
      </div>

      <InventoryStats products={products} />

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      <ProductTable products={filteredProducts} refresh={fetchProducts} />
    </section>
  );
};

export default Inventory;
