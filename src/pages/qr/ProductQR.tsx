import { QRCodeCanvas } from "qrcode.react";
import PageHeader from "../../components/common/PageHeader";
import { useProducts } from "../../hooks/useProducts";

const ProductQR = () => {
  const { products, loading } = useProducts();

  if (loading) {
    return <div className="loader">Loading QR codes...</div>;
  }

  return (
    <section className="qr-page">
      <PageHeader
        title="Product QR Codes"
        description="Scan or copy the QR product code to search products."
      />

      <div className="qr-grid">
        {products.map((product) => {
          const qrValue = product.id;

          return (
            <div className="qr-card" key={product.id}>
              <QRCodeCanvas value={qrValue} size={150} />

              <h3>{product.name}</h3>
              <p>{product.sku || "No SKU"}</p>

              <small className="qr-code-text">{qrValue}</small>

              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(qrValue)}
              >
                Copy QR Code
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProductQR;