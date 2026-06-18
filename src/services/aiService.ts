import type { Product } from "../types/Product";

type ChatMessage = {
  sender: "user" | "ai";
  text: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  import.meta.env.VITE_BACKEND_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:8000" : "");

const buildProductSummary = (products: Product[]) => {
  if (!products.length) {
    return "Inventory data is empty.";
  }

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryValue = products.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const lowStock = products.filter(
    (item) => item.quantity <= item.low_stock_limit
  );

  return [
    `Total products: ${totalProducts}.`,
    `Total stock quantity: ${totalStock} units.`,
    `Estimated inventory value: PHP ${inventoryValue.toFixed(2)}.`,
    lowStock.length
      ? `Low stock items: ${lowStock
          .map((item) => `${item.name} (${item.quantity} left)`)
          .join(", ")}.`
      : "No products are currently low on stock.",
  ].join(" ");
};

const getLocalInventoryResponse = (question: string, products: Product[]) => {
  const q = question.toLowerCase();
  const lowStock = products.filter(
    (item) => item.quantity <= item.low_stock_limit
  );
  const totalStocks = products.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryValue = products.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  if (q.includes("low stock")) {
    return lowStock.length
      ? `These products are low stock: ${lowStock
          .map((item) => `${item.name} (${item.quantity} left)`)
          .join(", ")}.`
      : "Great news! No products are currently low on stock.";
  }

  if (q.includes("total product")) {
    return `You currently have ${products.length} products in your inventory.`;
  }

  if (q.includes("total stock")) {
    return `Your total stock quantity is ${totalStocks} units.`;
  }

  if (q.includes("value") || q.includes("worth")) {
    return `Your estimated inventory value is PHP ${inventoryValue.toFixed(2)}.`;
  }

  const foundProduct = products.find((item) =>
    q.includes(item.name.toLowerCase())
  );

  if (foundProduct) {
    return `${foundProduct.name}: ${foundProduct.quantity} units available, category: ${
      foundProduct.category
    }, supplier: ${foundProduct.supplier || "N/A"}, price: PHP ${Number(
      foundProduct.price
    ).toFixed(2)}.`;
  }

  return `I could not reach the AI backend, but here is the current inventory summary: ${buildProductSummary(
    products
  )}`;
};

export const getAIInventoryResponse = async (
  question: string,
  products: Product[],
  history: ChatMessage[] = []
): Promise<string> => {
  if (!API_BASE_URL) {
    throw new Error(
      "Backend API URL is not configured. Set VITE_API_BASE_URL to your Render backend URL."
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai/inventory-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        history,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message || `AI backend failed with status ${response.status}.`
      );
    }

    return data?.answer?.trim() || "I couldn't generate a response right now.";
  } catch (error) {
    console.warn("AI backend unavailable, using local fallback.", error);
    return getLocalInventoryResponse(question, products);
  }
};
