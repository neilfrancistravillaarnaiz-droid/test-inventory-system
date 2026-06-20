import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import ProductTable from "../../components/inventory/ProductTable";
import SearchBar from "../../components/inventory/SearchBar";
import InventoryStats from "../../components/inventory/InventoryStats";
import { useCurrentProfile } from "../../hooks/useCurrentProfile";
import LetterHoverText from "../../components/common/LetterHoverText";

const Inventory = () => {
  const { products, loading, fetchProducts } = useProducts();
  const { can } = useCurrentProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearch(value);

    if (value.trim()) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

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
          <h2><LetterHoverText text="Inventory" /></h2>
          <p>Manage all products.</p>
        </div>

        {can("inventory:create") && (
          <Link className="primary-link add-btn" to="/inventory/add">
            Add Product
          </Link>
        )}
      </div>

      <InventoryStats products={products} />

      <SearchBar
        value={search}
        onChange={handleSearchChange}
      />

      <ProductTable
        products={filteredProducts}
        refresh={fetchProducts}
        canEdit={can("inventory:update")}
        canDelete={can("inventory:delete")}
      />
    </section>
  );
};

export default Inventory;
