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

const getStockStatus = (product: Product) => {
  if (Number(product.quantity) <= 0) return "out of stock";
  if (Number(product.quantity) <= Number(product.low_stock_limit) / 2) {
    return "critically low";
  }
  if (Number(product.quantity) <= Number(product.low_stock_limit)) {
    return "below reorder threshold";
  }

  return "healthy";
};

const getSuggestedRestock = (product: Product) =>
  Math.max(
    Number(product.low_stock_limit || 0) * 2 - Number(product.quantity || 0),
    Number(product.low_stock_limit || 0),
    1
  );

const findMentionedProduct = (question: string, products: Product[]) => {
  const normalized = normalizeQuestion(question);

  return products.find((product) => {
    const productName = normalizeQuestion(product.name);
    const productSku = normalizeQuestion(product.sku || "");

    return (
      normalized.includes(productName) ||
      Boolean(productSku && normalized.includes(productSku))
    );
  });
};

const getRequestedQuantity = (question: string) => {
  const match = question.match(/\b(\d+)\s*(?:units?|pcs|pieces?|items?)?\b/i);

  return match ? Number(match[1]) : null;
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

const isShowRequest = (text: string) =>
  includesAny(text, [
    "show me",
    "show the",
    "open",
    "view",
    "display",
    "take me to",
    "where can i see",
  ]);

const getEmotionResponse = (question: string, normalizedQuestion: string) => {
  if (
    /\b(ha|haha|hahaha|hehe|lol|lmao|rofl|funny)\b/i.test(question) ||
    /[\u{1F600}-\u{1F606}\u{1F923}]/u.test(question)
  ) {
    return "Haha, glad we are having a good moment. I am still ready if you want to check stocks, products, suppliers, or restocking.";
  }

  if (
    includesAny(normalizedQuestion, [
      "sad",
      "cry",
      "crying",
      "tears",
      "upset",
      "huhu",
      "hu hu",
    ]) ||
    /[\u{1F622}\u{1F62D}]/u.test(question)
  ) {
    return "I am sorry you feel that way. I am here with you, and I can help make the inventory side easier one step at a time.";
  }

  if (
    includesAny(normalizedQuestion, [
      "angry",
      "mad",
      "annoyed",
      "frustrated",
      "irritated",
      "stress",
      "stressed",
    ]) ||
    /[\u{1F620}\u{1F621}]/u.test(question)
  ) {
    return "I get it, that sounds frustrating. Tell me what part is causing trouble and I will help you fix it calmly.";
  }

  if (
    includesAny(normalizedQuestion, [
      "happy",
      "excited",
      "yay",
      "yey",
      "love it",
      "perfect",
    ])
  ) {
    return "Love that energy. You can ask me to check available stocks, low-stock items, reports, suppliers, or restock suggestions next.";
  }

  if (
    includesAny(normalizedQuestion, [
      "confused",
      "lost",
      "idk",
      "i dont know",
      "i do not know",
      "help me",
    ])
  ) {
    return "No worries. Tell me what page or inventory task you are on, and I will guide you through it.";
  }

  if (
    includesAny(normalizedQuestion, [
      "scared",
      "worried",
      "nervous",
      "anxious",
      "afraid",
    ])
  ) {
    return "It is okay to slow down. I can help you check the data first before you make any inventory changes.";
  }

  if (
    includesAny(normalizedQuestion, [
      "tired",
      "sleepy",
      "exhausted",
      "drained",
    ])
  ) {
    return "You have been working hard. I can help summarize the inventory quickly so you do not have to inspect everything manually.";
  }

  return null;
};

const getLocalInventoryResponse = (question: string, products: Product[]) => {
  const q = question.toLowerCase();
  const normalizedQuestion = normalizeQuestion(question);
  const mentionedProduct = findMentionedProduct(question, products);
  const requestedQuantity = getRequestedQuantity(question);
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
  const emotionResponse = getEmotionResponse(question, normalizedQuestion);

  if (emotionResponse) {
    return emotionResponse;
  }

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
    mentionedProduct &&
    includesAny(q, [
      "how many",
      "how much",
      "units left",
      "stock left",
      "left",
      "available",
      "on hand",
    ])
  ) {
    return `Let me pull that up for you. We currently have ${
      mentionedProduct.quantity
    } unit(s) of ${mentionedProduct.name}${
      mentionedProduct.sku ? ` (${mentionedProduct.sku})` : ""
    } in stock. Location: ${getLocation(mentionedProduct)}. Reorder point: ${
      mentionedProduct.low_stock_limit
    }. Status: ${getStockStatus(mentionedProduct)}. ${
      getStockStatus(mentionedProduct) === "healthy"
        ? "No urgent reorder is needed right now."
        : `I recommend adding about ${getSuggestedRestock(
            mentionedProduct
          )} unit(s).`
    }`;
  }

  if (
    includesAny(q, [
      "overall stock status",
      "stock status today",
      "inventory snapshot",
      "inventory health",
      "overall inventory",
    ])
  ) {
    const criticalStock = products.filter(
      (item) =>
        Number(item.quantity) > 0 &&
        Number(item.quantity) <= Number(item.low_stock_limit) / 2
    );
    const healthyStock = products.filter(
      (item) => Number(item.quantity) > Number(item.low_stock_limit)
    );

    return `Here is your StockFlow snapshot: ${products.length} active product(s), ${healthyStock.length} healthy, ${lowStock.length} below reorder threshold, ${criticalStock.length} critically low, and ${outOfStock.length} out of stock. ${
      criticalStock.length
        ? `The most urgent items are ${criticalStock
            .slice(0, 5)
            .map((item) => `${item.name} (${item.quantity} left)`)
            .join(", ")}.`
        : "No critical stock issue is showing right now."
    }`;
  }

  if (
    includesAny(q, [
      "sales and inventory report",
      "weekly report",
      "this week report",
      "report for this week",
      "sales report",
      "weekly summary",
    ])
  ) {
    return `Here is the StockFlow inventory summary I can verify from current product data: ${products.length} active product(s), ${totalStocks} total units on hand, ${formatCurrency(
      inventoryValue
    )} estimated inventory value, ${lowStock.length} below reorder threshold, and ${outOfStock.length} out of stock. Sales totals, units sold this week, and week-over-week movement require stock-out/sales history from the backend report data.`;
  }

  if (
    includesAny(q, [
      "not moving",
      "slow moving",
      "zero movement",
      "no movement",
      "dead stock",
      "stale stock",
    ])
  ) {
    const highestValueStock = [...products]
      .sort(
        (a, b) =>
          Number(b.quantity) * Number(b.price) -
          Number(a.quantity) * Number(a.price)
      )
      .slice(0, 5);

    return highestValueStock.length
      ? `I need stock movement or sales history to confirm which products are truly not moving. From current inventory value alone, these products tie up the most stock value and may be worth reviewing: ${highestValueStock
          .map((item) => `${item.name} (${item.quantity} units, ${formatCurrency(Number(item.quantity) * Number(item.price))})`)
          .join(", ")}. Check Reports or Stock History for movement details.`
      : "I need product and movement data to identify non-moving stock.";
  }

  if (
    includesAny(q, [
      "inventory turnover",
      "turnover rate",
      "stock turnover",
      "turnover",
    ])
  ) {
    return `I can calculate inventory value from current stock (${formatCurrency(
      inventoryValue
    )}), but turnover rate needs sales or stock-out history over a date range. Open Reports or Stock History to review movement data; once sales/stock-out totals are available, turnover can be estimated as stock moved divided by average inventory.`;
  }

  if (
    includesAny(q, [
      "enough stock",
      "fulfill",
      "fulfil",
      "complete this order",
      "cover this order",
      "can we supply",
    ])
  ) {
    if (!mentionedProduct || !requestedQuantity) {
      return "I can check that for you. Please include the product name and quantity, for example: Do we have enough stock for 20 units of Mouse?";
    }

    const shortfall = requestedQuantity - Number(mentionedProduct.quantity);

    return shortfall <= 0
      ? `Yes. You need ${requestedQuantity} unit(s) of ${mentionedProduct.name}, and StockFlow shows ${mentionedProduct.quantity} available. After fulfilling it, about ${mentionedProduct.quantity - requestedQuantity} unit(s) would remain.`
      : `Not enough stock. You need ${requestedQuantity} unit(s) of ${mentionedProduct.name}, but only ${mentionedProduct.quantity} are available. That is a shortfall of ${shortfall} unit(s). You can record the available quantity through Stock Out and restock about ${Math.max(shortfall, getSuggestedRestock(mentionedProduct))} unit(s).`;
  }

  if (
    includesAny(q, [
      "transfer stock",
      "transfer between warehouse",
      "transfer between warehouses",
      "move stock",
      "move inventory",
      "warehouse transfer",
    ])
  ) {
    return "StockFlow currently records Stock In and Stock Out actions, but I do not see a dedicated warehouse transfer module yet. To reflect a transfer now, record stock out from the source location and stock in to the destination location, then update the product location details if needed.";
  }

  if (
    includesAny(q, [
      "change reorder point",
      "update reorder point",
      "set reorder point",
      "change low stock",
      "update low stock",
      "set low stock",
      "threshold",
    ])
  ) {
    if (mentionedProduct) {
      return `I found ${mentionedProduct.name}. Its current low-stock limit is ${mentionedProduct.low_stock_limit}. To change it, open the product in Inventory, click Edit Product, update the low stock limit, and save. I cannot safely change it from chat yet.`;
    }

    return "I can help you find the product, but I need the product name or SKU. To update a reorder point, go to Inventory, edit the product, and change the low stock limit.";
  }

  if (
    includesAny(q, [
      "who made changes",
      "who changed",
      "inventory last night",
      "changes last night",
      "audit last night",
      "last night",
    ])
  ) {
    return "That information belongs in the Audit Trail. Open the Audit page to review who changed inventory records and when. The fallback chatbot only has product totals, so it cannot verify usernames or exact timestamps without audit log data from the backend.";
  }

  if (
    includesAny(q, [
      "discrepancy",
      "stock count mismatch",
      "mismatch",
      "wrong stock",
      "incorrect stock",
      "physical count",
    ])
  ) {
    if (mentionedProduct) {
      return `Let's check ${mentionedProduct.name}. StockFlow currently shows ${mentionedProduct.quantity} unit(s), SKU ${mentionedProduct.sku || "N/A"}, location ${getLocation(mentionedProduct)}. Compare that with your physical count. If it does not match, review Stock History and record the correction through Stock In or Stock Out with a clear note.`;
    }

    return "Let's sort that out. Tell me the product name or SKU, and I will show the system count, location, and next steps for checking the stock history.";
  }

  if (isShowRequest(q)) {
    if (
      includesAny(q, [
        "stock",
        "stocks",
        "inventory",
        "products",
        "items",
        "product list",
      ])
    ) {
      return `You can view stocks on the Inventory page. Current available products: ${formatProductList(
        availableProducts
      )}.`;
    }

    if (includesAny(q, ["report", "reports", "csv", "print"])) {
      return `Open the Reports page to view, print, or export inventory reports. Quick report summary: ${products.length} products, ${totalStocks} total units, ${formatCurrency(
        inventoryValue
      )} estimated value, and ${lowStock.length} low-stock item(s).`;
    }

    if (
      includesAny(q, [
        "file",
        "files",
        "export",
        "exports",
        "download",
        "downloads",
      ])
    ) {
      return "Inventory files and exports are handled from the Reports page. Use Export CSV to download inventory data, or Print Report to create a printable copy.";
    }

    if (
      includesAny(q, ["audit", "audits", "audit trail", "logs", "activity"])
    ) {
      return "Open the Audit Trail page to view system activity logs, including product changes, stock actions, and inventory events.";
    }

    if (includesAny(q, ["alert", "alerts", "notification", "notifications"])) {
      return lowStock.length
        ? `Open the Notifications page to view alerts. Current low-stock alerts should include: ${lowStock
            .map((item) => item.name)
            .join(", ")}.`
        : "Open the Notifications page to view alerts. There are no low-stock products based on the current inventory data.";
    }

    if (includesAny(q, ["supplier", "suppliers"])) {
      const suppliers = Array.from(
        new Set(products.map((item) => item.supplier).filter(Boolean))
      );

      return suppliers.length
        ? `Open the Suppliers page to manage supplier records. Current suppliers: ${suppliers.join(
            ", "
          )}.`
        : "Open the Suppliers page to manage supplier records. No suppliers are recorded in the current inventory data.";
    }

    if (includesAny(q, ["category", "categories"])) {
      const categories = Array.from(
        new Set(products.map((item) => item.category).filter(Boolean))
      );

      return categories.length
        ? `Open the Categories page to manage product groups. Current categories: ${categories.join(
            ", "
          )}.`
        : "Open the Categories page to manage product groups. No categories are recorded in the current inventory data.";
    }

    if (includesAny(q, ["qr", "barcode", "scanner", "scan"])) {
      return "Open the QR or Barcode tools to generate product QR codes, search by QR data, or scan products faster.";
    }

    if (includesAny(q, ["restock", "predictor", "recommendation"])) {
      return lowStock.length
        ? `Open the Smart Restock Predictor to view restock recommendations. Current low-stock products: ${lowStock
            .map((item) => item.name)
            .join(", ")}.`
        : "Open the Smart Restock Predictor to view recommendations. Right now, no urgent restock is needed based on current quantities.";
    }

    if (includesAny(q, ["dashboard", "home", "command center"])) {
      return `Open the Dashboard for the main overview. Current snapshot: ${products.length} products, ${totalStocks} total units, ${formatCurrency(
        inventoryValue
      )} estimated value.`;
    }
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
    if (!lowStock.length) {
      return "Great news! No products are currently low on stock.";
    }

    const urgentLowStock = [...lowStock]
      .sort(
        (a, b) =>
          Number(a.quantity) -
          Number(a.low_stock_limit) -
          (Number(b.quantity) - Number(b.low_stock_limit))
      )
      .slice(0, 5);

    return `I have flagged ${lowStock.length} item(s) below their reorder points. The most urgent ones are ${urgentLowStock
      .map(
        (item) =>
          `${item.name} at ${item.quantity} unit(s), reorder point ${item.low_stock_limit}`
      )
      .join(", ")}. You can review them in Notifications or the Smart Restock Predictor.`;
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
    if (mentionedProduct) {
      return `For ${mentionedProduct.name}, StockFlow shows ${
        mentionedProduct.quantity
      } unit(s) on hand with a reorder point of ${
        mentionedProduct.low_stock_limit
      }. Preferred supplier from your product record: ${
        mentionedProduct.supplier || "not assigned"
      }. I recommend adding about ${getSuggestedRestock(
        mentionedProduct
      )} unit(s). You can record the incoming quantity on the Stock In page.`;
    }

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
      "pending purchase order",
      "pending purchase orders",
      "open po",
      "open purchase order",
      "po status",
      "purchase order status",
    ])
  ) {
    return "StockFlow currently tracks products, suppliers, stock in/out, reports, alerts, QR/barcode tools, and audit logs. I do not see a purchase order module in the current data, so I cannot verify pending PO status yet.";
  }

  if (
    includesAny(q, [
      "why didnt i get an alert",
      "why did not i get an alert",
      "why no alert",
      "alert earlier",
      "missed alert",
    ])
  ) {
    return lowStock.length
      ? `I can confirm ${lowStock.length} product(s) are below their reorder threshold now. If an alert did not appear earlier, check the Notifications page and confirm each product's low-stock limit is set correctly. Current low-stock items: ${lowStock
          .map((item) => `${item.name} (${item.quantity}/${item.low_stock_limit})`)
          .join(", ")}.`
      : "I do not see any low-stock products right now. If you expected an alert, check whether the product's low-stock limit is set high enough in its product details.";
  }

  if (
    includesAny(q, [
      "stockout this week",
      "stock out this week",
      "risk of stockout",
      "projected to stock out",
      "run out this week",
    ])
  ) {
    const atRisk = [...lowStock]
      .sort((a, b) => Number(a.quantity) - Number(b.quantity))
      .slice(0, 5);

    return atRisk.length
      ? `I do not have sales velocity in the current fallback data, but based on current quantity versus reorder limits, these products are most at risk: ${atRisk
          .map((item) => `${item.name} (${item.quantity} left, limit ${item.low_stock_limit})`)
          .join(", ")}.`
      : "I do not see products below their reorder threshold right now, so no immediate stockout risk is showing from current quantities.";
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
