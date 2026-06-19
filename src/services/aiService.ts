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

const includesAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

const formatCurrency = (value: number) =>
  `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getLocation = (product: Product) => {
  const location = [
    product.warehouse,
    product.shelf,
    product.rack,
    product.bin,
  ]
    .filter(Boolean)
    .join(" / ");

  return location || "Not assigned";
};

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
  const outOfStock = products.filter((item) => item.quantity <= 0);
  const availableProducts = products.filter((item) => item.quantity > 0);
  const totalStocks = products.reduce((sum, item) => sum + item.quantity, 0);
  const inventoryValue = products.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const sortedByQuantity = [...products].sort(
    (a, b) => Number(b.quantity) - Number(a.quantity)
  );
  const sortedByPrice = [...products].sort(
    (a, b) => Number(b.price) - Number(a.price)
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
    return "I can help with StockFlow questions about available stocks, low-stock and out-of-stock products, total products, inventory value, suppliers, categories, product locations, SKU details, restock suggestions, stock in/out actions, reports, QR/barcode tools, audit logs, and notifications.";
  }

  if (
    q.includes("available stock") ||
    q.includes("stocks available") ||
    q.includes("what stocks") ||
    q.includes("available product") ||
    q.includes("available products") ||
    q.includes("products available") ||
    q.includes("what products") ||
    q.includes("list products") ||
    q.includes("show products")
  ) {
    return `Available products: ${formatProductList(availableProducts)}.`;
  }

  if (
    q.includes("out of stock") ||
    q.includes("zero stock") ||
    q.includes("no stock")
  ) {
    return outOfStock.length
      ? `Out-of-stock products: ${outOfStock
          .map((item) => item.name)
          .join(", ")}.`
      : "No products are currently out of stock.";
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

  if (
    q.includes("total stock") ||
    q.includes("how many stock") ||
    q.includes("how many stocks") ||
    q.includes("number of stock") ||
    q.includes("stock count")
  ) {
    return `Your total stock quantity is ${totalStocks} units.`;
  }

  if (q.includes("stock status") || q.includes("inventory status")) {
    return `Inventory status: ${products.length} products, ${totalStocks} total units, ${lowStock.length} low-stock item(s), and ${availableProducts.length} product(s) currently available.`;
  }

  if (
    includesAny(q, ["highest stock", "most stock", "largest stock", "top stock"])
  ) {
    const topProducts = sortedByQuantity.slice(0, 5);

    return topProducts.length
      ? `Highest-stock products: ${topProducts
          .map((item) => `${item.name} (${item.quantity} units)`)
          .join(", ")}.`
      : "No products are recorded yet.";
  }

  if (
    includesAny(q, [
      "lowest stock",
      "least stock",
      "smallest stock",
      "fewest stock",
    ])
  ) {
    const bottomProducts = [...products]
      .sort((a, b) => Number(a.quantity) - Number(b.quantity))
      .slice(0, 5);

    return bottomProducts.length
      ? `Lowest-stock products: ${bottomProducts
          .map((item) => `${item.name} (${item.quantity} units)`)
          .join(", ")}.`
      : "No products are recorded yet.";
  }

  if (q.includes("value") || q.includes("worth")) {
    return `Your estimated inventory value is ${formatCurrency(
      inventoryValue
    )}.`;
  }

  if (
    includesAny(q, [
      "most expensive",
      "highest price",
      "expensive product",
      "top price",
    ])
  ) {
    const topPrices = sortedByPrice.slice(0, 5);

    return topPrices.length
      ? `Highest-priced products: ${topPrices
          .map((item) => `${item.name} (${formatCurrency(Number(item.price))})`)
          .join(", ")}.`
      : "No product prices are recorded yet.";
  }

  if (
    includesAny(q, [
      "cheapest",
      "lowest price",
      "least expensive",
      "affordable",
    ])
  ) {
    const lowPrices = [...products]
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, 5);

    return lowPrices.length
      ? `Lowest-priced products: ${lowPrices
          .map((item) => `${item.name} (${formatCurrency(Number(item.price))})`)
          .join(", ")}.`
      : "No product prices are recorded yet.";
  }

  if (q.includes("restock") || q.includes("reorder")) {
    if (!lowStock.length) {
      return "No urgent restock is needed right now. All products are above or equal to their stock requirements.";
    }

    return `Recommended restock: ${lowStock
      .map((item) => {
        const recommendedRestock = Math.max(
          Number(item.low_stock_limit || 0) * 2 - Number(item.quantity || 0),
          Number(item.low_stock_limit || 0)
        );

        return `${item.name}: add about ${recommendedRestock} units`;
      })
      .join(", ")}.`;
  }

  if (
    includesAny(q, [
      "location",
      "where is",
      "where are",
      "warehouse",
      "rack",
      "shelf",
      "bin",
    ])
  ) {
    const productWithLocation = products.find((item) =>
      q.includes(item.name.toLowerCase())
    );

    if (productWithLocation) {
      return `${productWithLocation.name} location: ${getLocation(
        productWithLocation
      )}.`;
    }

    const locatedProducts = products
      .filter((item) => getLocation(item) !== "Not assigned")
      .slice(0, 8);

    return locatedProducts.length
      ? `Product locations: ${locatedProducts
          .map((item) => `${item.name}: ${getLocation(item)}`)
          .join("; ")}.`
      : "No product locations are assigned yet.";
  }

  if (q.includes("sku") || q.includes("code")) {
    const productsWithSku = products
      .filter((item) => item.sku)
      .slice(0, 10)
      .map((item) => `${item.name}: ${item.sku}`)
      .join(", ");

    return productsWithSku
      ? `Product SKU codes: ${productsWithSku}.`
      : "No SKU codes are recorded yet.";
  }

  if (includesAny(q, ["stock in", "add stock", "incoming stock"])) {
    return "Use the Stock In page to add incoming stock. Select a product, enter the quantity to add, add an optional note, then submit Add Stock.";
  }

  if (includesAny(q, ["stock out", "remove stock", "outgoing stock"])) {
    return "Use the Stock Out page to remove stock from inventory. Select a product, enter the quantity to remove, add a reason or note, then submit Remove Stock.";
  }

  if (includesAny(q, ["add product", "new product", "create product"])) {
    return "To add a product, go to Inventory, click Add Product, then enter the product name, SKU, category, supplier, quantity, price, low stock limit, and location details.";
  }

  if (includesAny(q, ["edit product", "update product", "change product"])) {
    return "To edit a product, open the Inventory page, choose the product, click Edit Product, update the fields, and save the changes.";
  }

  if (includesAny(q, ["delete product", "remove product"])) {
    return "To delete a product, open the Inventory page, click Delete Product on the item, and confirm the deletion. Be careful because this removes the record.";
  }

  if (includesAny(q, ["report", "reports", "export csv", "print"])) {
    return "The Reports page shows inventory totals and product report data. You can export a CSV or print the report from there.";
  }

  if (includesAny(q, ["qr", "barcode", "scan", "scanner"])) {
    return "The QR and barcode tools help you generate product QR codes, search products by QR data, and quickly identify inventory items.";
  }

  if (includesAny(q, ["audit", "logs", "audit trail", "activity"])) {
    return "The Audit Trail records system activity like product changes, stock actions, and important inventory events for monitoring.";
  }

  if (includesAny(q, ["notification", "notifications", "alert", "alerts"])) {
    return lowStock.length
      ? `Notifications can alert you about low stock. Current low-stock items: ${lowStock
          .map((item) => item.name)
          .join(", ")}.`
      : "Notifications can alert you about low stock. Right now, there are no low-stock products.";
  }

  if (includesAny(q, ["dashboard", "command center", "home"])) {
    return `The Dashboard gives a quick view of your inventory: ${products.length} products, ${totalStocks} total units, ${formatCurrency(
      inventoryValue
    )} estimated value, and ${lowStock.length} low-stock item(s).`;
  }

  if (includesAny(q, ["settings", "profile", "account"])) {
    return "You can manage account and system preferences from the Settings and profile areas. For inventory defaults, check the Settings page.";
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
