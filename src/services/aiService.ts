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

const isGreeting = (question: string) =>
  /^(hi|hello|hey|good morning|good afternoon|good evening|kumusta|kamusta|yo)\b/i.test(
    question.trim()
  );

const isCapabilityQuestion = (question: string) => {
  const q = question.toLowerCase();

  return (
    q.includes("what can you do") ||
    q.includes("help") ||
    q.includes("how do i use") ||
    q.includes("what are you") ||
    q.includes("who are you")
  );
};

const normalizeQuestion = (question: string) =>
  question
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatProductList = (products: Product[], limit = 8) => {
  if (!products.length) {
    return "No products are available in your inventory yet.";
  }

  const visibleProducts = products.slice(0, limit);
  const remainingCount = products.length - visibleProducts.length;
  const productList = visibleProducts
    .map((item) => `${item.name} (${item.quantity} in stock)`)
    .join(", ");

  return remainingCount > 0
    ? `${productList}, and ${remainingCount} more.`
    : productList;
};

const getLocalInventoryResponse = (question: string, products: Product[]) => {
  const q = question.toLowerCase();
  const normalizedQuestion = normalizeQuestion(question);
  const lowStock = products.filter(
    (item) => item.quantity <= item.low_stock_limit
  );
  const availableProducts = products.filter((item) => item.quantity > 0);
  const totalStocks = products.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryValue = products.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  if (
    ["wow", "nice", "great", "awesome", "cool", "amazing", "good"].includes(
      normalizedQuestion
    )
  ) {
    return "Glad you like it! You can ask me for product lists, low-stock alerts, restock suggestions, suppliers, or inventory value anytime.";
  }

  if (
    [
      "ok",
      "okay",
      "k",
      "alright",
      "sure",
      "got it",
      "noted",
      "yes",
      "yeah",
      "yep",
    ].includes(normalizedQuestion)
  ) {
    return "Okay, noted. I am here when you need help checking your inventory.";
  }

  if (
    normalizedQuestion.includes("thank you") ||
    normalizedQuestion.includes("thanks") ||
    normalizedQuestion.includes("thank u") ||
    normalizedQuestion.includes("ty")
  ) {
    return "You are welcome! Happy to help with your inventory anytime.";
  }

  if (
    [
      "bye",
      "goodbye",
      "see you",
      "see ya",
      "later",
      "exit",
      "close",
    ].includes(normalizedQuestion)
  ) {
    return "Goodbye! I will be here when you need inventory help again.";
  }

  if (
    normalizedQuestion.includes("sorry") ||
    normalizedQuestion.includes("my bad")
  ) {
    return "No worries at all. Tell me what inventory question you want to check.";
  }

  if (
    q.includes("how are you") ||
    q.includes("how r u") ||
    q.includes("are you okay")
  ) {
    return "I am doing great and ready to help with your inventory. Ask me about products, low stocks, suppliers, restocking, or inventory value.";
  }

  if (isGreeting(question)) {
    return "Hi! I am your AI Inventory Assistant. You can ask me about low stock, product counts, suppliers, inventory value, restocking, barcode/QR workflows, or a specific product.";
  }

  if (isCapabilityQuestion(question)) {
    return "I can help with inventory questions like which products are low stock, how many items you have, supplier details, restock suggestions, product locations, and quick summaries of your stock data.";
  }

  if (
    q.includes("available product") ||
    q.includes("available products") ||
    q.includes("products available") ||
    q.includes("what products") ||
    q.includes("list products") ||
    q.includes("show products")
  ) {
    return `Available products: ${formatProductList(availableProducts)}.`;
  }

  if (q.includes("category") || q.includes("categories")) {
    const categories = Array.from(
      new Set(products.map((item) => item.category).filter(Boolean))
    );

    return categories.length
      ? `Your product categories are: ${categories.join(", ")}.`
      : "No product categories are recorded yet.";
  }

  if (q.includes("supplier") || q.includes("suppliers")) {
    const suppliers = Array.from(
      new Set(products.map((item) => item.supplier).filter(Boolean))
    );

    return suppliers.length
      ? `Your suppliers are: ${suppliers.join(", ")}.`
      : "No suppliers are recorded yet.";
  }

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

  if (q.includes("stock status") || q.includes("inventory status")) {
    return `Inventory status: ${products.length} products, ${totalStocks} total units, ${lowStock.length} low-stock item(s), and ${availableProducts.length} product(s) currently available.`;
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

  return `I can still help with your inventory summary while the AI backend is unavailable: ${buildProductSummary(
    products
  )}`;
};

export const getAIInventoryResponse = async (
  question: string,
  products: Product[],
  history: ChatMessage[] = []
): Promise<string> => {
  if (!API_BASE_URL) {
    return getLocalInventoryResponse(question, products);
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
