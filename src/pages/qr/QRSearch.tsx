import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { useProducts } from "../../hooks/useProducts";

const QRSearch = () => {
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const [search, setSearch] = useState("");

  const cleanSearch = search.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const searchableText = [
      product.id,
      product.name,
      product.sku || "",
      product.category,
      product.supplier || "",
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(cleanSearch);
  });

  const handleSearch = () => {
    if (!search.trim()) {
      alert("Enter or paste a QR code/product code first.");
      return;
    }

    const exactProduct = products.find(
      (product) =>
        product.id.toLowerCase() === cleanSearch ||
        product.sku?.toLowerCase() === cleanSearch
    );

    if (!exactProduct) {
      alert("No product found for this QR code.");
      return;
    }

    navigate(`/products/${exactProduct.id}`);
  };

  if (loading) {
    return <div className="loader">Loading product lookup...</div>;
  }

  return (
    <section className="qr-search-page">
      <PageHeader
        title="QR Product Lookup"
        description="Paste the QR code or search by product name, SKU, category, or supplier."
      />

      <div className="qr-search-panel">
        <h3>Find Product</h3>
        <p>Paste QR code here or search product details manually.</p>

        <div className="qr-search-row">
          <input
            type="text"
            placeholder="Paste QR code, product ID, SKU, or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            autoFocus
          />

          <button type="button" onClick={handleSearch}>
            Search Product
          </button>
        </div>
      </div>

      <div className="qr-search-results">
        {filteredProducts.length === 0 ? (
          <div className="content-card">No matching products found.</div>
        ) : (
          filteredProducts.map((product) => (
            <button
              className="qr-search-card"
              key={product.id}
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <img
                src={
                  product.image_url ||
                  "https://via.placeholder.com/80?text=Item"
                }
                alt={product.name}
              />

              <div>
                <h3>{product.name}</h3>
                <p>
                  {product.sku || "No SKU"} • {product.category}
                </p>
                <span>
                  Qty: {product.quantity} | ₱
                  {Number(product.price).toFixed(2)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
};

export default QRSearch;