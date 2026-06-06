import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import PageHeader from "../../components/common/PageHeader";
import { useProducts } from "../../hooks/useProducts";
import type { Product } from "../../types/Product";

const ProductBarcode = () => {
  const { products, loading } = useProducts();
  const barcodeRefs = useRef<Record<string, SVGSVGElement | null>>({});

  const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const generateBarcodeValue = (product: Product) => {
    return product.sku?.trim() || product.id;
  };

  const handlePrintBarcode = (product: Product) => {
    const barcodeValue = generateBarcodeValue(product);

    const printWindow = window.open("", "_blank", "width=700,height=800");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body {
              margin: 0;
              padding: 24px;
              background: #ffffff;
              font-family: Arial, sans-serif;
            }

            .print-card {
              width: 420px;
              margin: 0 auto;
              padding: 18px;
              background: #ffffff;
              border: 1px solid #d1d5db;
              text-align: center;
            }

            h1 {
              font-size: 20px;
              margin: 0 0 10px;
              color: #111827;
            }

            .barcode-wrapper {
              width: 100%;
              background: #ffffff;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 8px 0;
            }

            svg {
              width: auto !important;
              height: 100px !important;
              background: #ffffff !important;
              max-width: 90% !important;
            }

            .meta {
              margin-top: 10px;
              color: #111827;
              font-size: 13px;
              line-height: 1.5;
              text-align: left;
            }

            .meta span {
              display: block;
            }

            @media print {
              body {
                padding: 0;
                background: #ffffff;
              }

              .print-card {
                box-shadow: none;
                border: none;
                width: 380px;
                padding: 10px;
              }

              svg {
                width: 340px !important;
                height: 120px !important;
              }
            }
          </style>
        </head>

        <body>
          <div class="print-card">
            <h1>${escapeHtml(product.name)}</h1>

            <div class="barcode-wrapper">
              <svg id="print-barcode"></svg>
            </div>

            <div class="meta">
              <span><strong>SKU/ID:</strong> ${escapeHtml(barcodeValue)}</span>
              <span><strong>Category:</strong> ${escapeHtml(product.category || "N/A")}</span>
              <span><strong>Supplier:</strong> ${escapeHtml(product.supplier || "N/A")}</span>
            </div>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = function () {
              JsBarcode("#print-barcode", ${JSON.stringify(barcodeValue)}, {
                format: "CODE128",
                width: 1.45,
                height: 90,
                displayValue: true,
                fontSize: 16,
                margin: 12,
                lineColor: "#111827",
                background: "#ffffff"
              });

              setTimeout(function () {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => {
    products.forEach((product) => {
      const barcodeValue = generateBarcodeValue(product);
      const barcodeElement = barcodeRefs.current[product.id];

      if (barcodeElement && barcodeValue) {
        JsBarcode(barcodeElement, barcodeValue, {
          format: "CODE128",
          width: 1.45,
          height: 90,
          displayValue: true,
          fontSize: 16,
          margin: 12,
          lineColor: "#111827",
          background: "#ffffff",
        });
      }
    });
  }, [products]);

  if (loading) {
    return <div className="loader">Loading barcodes...</div>;
  }

  return (
    <section className="qr-page">
      <PageHeader
        title="Product Barcodes"
        description="Generate printable barcode labels for each product."
      />

      <div className="qr-grid">
        {products.map((product) => {
          const barcodeValue = generateBarcodeValue(product);

          return (
            <div className="qr-card" key={product.id}>
              <div className="barcode-display">
                <svg
                  ref={(el) => {
                    barcodeRefs.current[product.id] = el;
                  }}
                />
              </div>

              <h3>{product.name}</h3>
              <p>{barcodeValue}</p>

              <small className="qr-code-text">
                Category: {product.category} | Supplier:{" "}
                {product.supplier || "N/A"}
              </small>

              <button
                type="button"
                className="print-button"
                onClick={() => handlePrintBarcode(product)}
              >
                Print Barcode
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProductBarcode;