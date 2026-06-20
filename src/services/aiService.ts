import type { Product, ProductInput } from "../types/Product";
import { supabase } from "../lib/supabaseClient";
import { deleteStoredImage } from "./storageService";
import { addAuditLog } from "./auditLogService";
import { addCategory, deleteCategory, getCategories } from "./categoryService";
import { addSupplier, deleteSupplier, getSuppliers } from "./supplierService";
import {
  addNotification,
  getNotifications,
  updateNotificationStatus,
} from "./notificationService";
import { hasPermission, type Permission } from "../constants/permissions";

type ChatMessage = {
  sender: "user" | "ai";
  text: string;
};

export type AIAction = {
  label: string;
  path: string;
  prompt?: string;
};

export type AIResponse = {
  text: string;
  actions?: AIAction[];
  imageUrl?: string;
  imagePrompt?: string;
  shouldRefreshProducts?: boolean;
};

export type AIUserContext = {
  name?: string | null;
  role?: string | null;
};

type UserProfile = {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
};

type StockMovement = {
  id?: string;
  product_id?: string | null;
  product_name?: string | null;
  type?: string | null;
  quantity?: number | null;
  note?: string | null;
  created_at?: string | null;
};

type AuditLog = {
  id?: string;
  action?: string | null;
  module?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type Supplier = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

type AssistantData = {
  products: Product[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  suppliers: Supplier[];
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  import.meta.env.VITE_BACKEND_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:8000" : "");

const cleanAssistantText = (text: string) =>
  String(text || "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();

const reply = (text: string, actions: AIAction[] = []): AIResponse => ({
  text: cleanAssistantText(text),
  actions,
});

const toAIResponse = (response: string | AIResponse): AIResponse =>
  typeof response === "string"
    ? reply(response)
    : {
        ...response,
        text: cleanAssistantText(response.text),
      };

const routeAction = (label: string, path: string): AIAction => ({
  label,
  path,
});

type ProductRefreshChange =
  | { type: "upsert"; product: Product }
  | { type: "remove"; id: string };

const requestProductRefresh = (change?: ProductRefreshChange) => {
  window.dispatchEvent(
    new CustomEvent("stockflow:refresh-products", { detail: change })
  );
};

const withDefaultActions = (text: string): AIResponse =>
  reply(text, [
    routeAction("Inventory", "/inventory"),
    routeAction("Restock", "/restock-predictor"),
    routeAction("Reports", "/reports"),
  ]);

const getUnknownQuestionResponse = (products: Product[]): AIResponse =>
  reply(
    [
      "I do not know that yet, but I can still help with StockFlow inventory tasks.",
      products.length
        ? `Right now I can answer questions about your ${products.length} product(s), stock levels, low-stock alerts, suppliers, reports, QR/barcode tools, audit logs, and restocking.`
        : "Your product list is empty right now, so I can mostly guide you around the system pages.",
      "Try asking: \"What products are available?\", \"What items are low stock?\", \"Show me reports\", or \"How many stocks do we have?\"",
    ].join(" "),
    [
      routeAction("Open Inventory", "/inventory"),
      routeAction("Open Reports", "/reports"),
      routeAction("Open Alerts", "/notifications"),
    ]
  );

const getAssistantData = async (products: Product[]): Promise<AssistantData> => {
  const [stockMovementsResult, auditLogsResult, suppliersResult] =
    await Promise.allSettled([
      supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  return {
    products,
    stockMovements:
      stockMovementsResult.status === "fulfilled"
        ? (stockMovementsResult.value.data as StockMovement[]) || []
        : [],
    auditLogs:
      auditLogsResult.status === "fulfilled"
        ? (auditLogsResult.value.data as AuditLog[]) || []
        : [],
    suppliers:
      suppliersResult.status === "fulfilled"
        ? (suppliersResult.value.data as Supplier[]) || []
        : [],
  };
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
    q.includes("how do i use")
  );
};

const isIdentityQuestion = (question: string) => {
  const q = question.toLowerCase();

  return (
    q.includes("who are you") ||
    q.includes("what are you") ||
    q.includes("what is your name") ||
    q.includes("what's your name") ||
    q.includes("your name") ||
    q.includes("are you ai") ||
    q.includes("are you an ai") ||
    q.includes("who made you")
  );
};

const isUserIdentityQuestion = (question: string) => {
  const q = question.toLowerCase();

  return (
    q.includes("who am i") ||
    q.includes("who i am") ||
    q.includes("what is my name") ||
    q.includes("what's my name") ||
    q.includes("whats my name") ||
    q.includes("my name") ||
    q.includes("what is my identity") ||
    q.includes("what's my identity") ||
    q.includes("whats my identity") ||
    q.includes("my identity") ||
    q.includes("what is my profile") ||
    q.includes("what's my profile") ||
    q.includes("my account") ||
    q.includes("my role") ||
    q.includes("what is my role") ||
    q.includes("what's my role")
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

const isWebSearchQuestion = (question: string) => {
  const q = question.toLowerCase();

  return includesAny(q, [
    "search web",
    "search the web",
    "internet",
    "online",
    "latest",
    "current",
    "today",
    "news",
    "market price",
    "supplier price",
    "compare price",
    "product info",
    "trend",
    "trends",
    "who is",
    "who are",
    "who was",
    "where is",
    "when was",
    "president",
    "city college",
    "city college of davao",
    "supreme student government",
    "ssg",
    "osa",
  ]);
};

const isImageGenerationQuestion = (question: string) => {
  const q = question.toLowerCase();

  return includesAny(q, [
    "generate image",
    "create image",
    "make image",
    "provide image",
    "show me an image",
    "make a picture",
    "create a picture",
    "generate a picture",
    "image of",
    "picture of",
    "poster of",
    "visual of",
    "illustration of",
  ]);
};

const isCcdAssetRequest = (question: string) => {
  const q = question.toLowerCase();

  return (
    includesAny(q, ["show", "display", "open", "photo", "picture", "image", "logo"]) &&
    includesAny(q, ["ccd", "city college", "city college of davao"])
  );
};

const getCcdAssetResponse = (question: string): AIResponse => {
  const q = question.toLowerCase();
  const wantsLogo = q.includes("logo") || q.includes("seal");
  const imageUrl = wantsLogo ? "/ccd-logo.jpg" : "/ccd-campus1.jpg";

  return {
    text: wantsLogo
      ? "Here is the City College of Davao logo from your uploaded project assets."
      : "Here is a City College of Davao campus photo from your uploaded project assets.",
    imageUrl,
    imagePrompt: wantsLogo
      ? "City College of Davao logo"
      : "City College of Davao campus photo",
    actions: [routeAction("Open Dashboard", "/dashboard")],
  };
};

const cleanImagePrompt = (question: string) =>
  question
    .replace(
      /\b(generate|create|make|provide|show me|can you|please|an?|the)\b/gi,
      " "
    )
    .replace(/\b(image|picture|poster|visual|illustration|of|for)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildPollinationsUrl = (prompt: string) => {
  const normalized = prompt.toLowerCase();
  const ccdStyle =
    normalized.includes("ccd") ||
    normalized.includes("city college") ||
    normalized.includes("city college of davao")
      ? "City College of Davao inspired, academic institutional presentation, green and gold accents, respectful school branding style, "
      : "";

  const finalPrompt = `${ccdStyle}clean professional inventory system visual, green glassmorphism interface aesthetic, soft warehouse technology lighting, modern dashboard friendly composition, high quality, ${prompt}`;

  return {
    imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(
      finalPrompt
    )}?width=1024&height=768&seed=${Math.floor(Date.now() / 1000)}&nologo=true`,
    imagePrompt: finalPrompt,
  };
};

const generateInventoryImage = async (question: string): Promise<AIResponse> => {
  const prompt =
    cleanImagePrompt(question) ||
    "StockFlow inventory system assistant visual for City College of Davao";

  if (!API_BASE_URL) {
    const generated = buildPollinationsUrl(prompt);

    return {
      text: "I generated a StockFlow-style visual for you.",
      imageUrl: generated.imageUrl,
      imagePrompt: generated.imagePrompt,
      actions: [routeAction("Open Dashboard", "/dashboard")],
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        width: 1024,
        height: 768,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message || `Image generation failed with status ${response.status}.`
      );
    }

    return {
      text: "I generated a StockFlow-style visual for you.",
      imageUrl: data?.imageUrl,
      imagePrompt: data?.prompt || prompt,
      actions: [routeAction("Open Dashboard", "/dashboard")],
    };
  } catch (error) {
    console.warn("Image backend unavailable, using Pollinations URL fallback.", error);
    const generated = buildPollinationsUrl(prompt);

    return {
      text: "I generated a visual using the fallback image service.",
      imageUrl: generated.imageUrl,
      imagePrompt: generated.imagePrompt,
      actions: [routeAction("Open Dashboard", "/dashboard")],
    };
  }
};

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

const findProductByCommandName = (rawName: string, products: Product[]) => {
  const normalizedName = normalizeQuestion(rawName);

  if (!normalizedName) return null;

  return (
    products.find(
      (product) => normalizeQuestion(product.name) === normalizedName
    ) ||
    products.find((product) =>
      normalizeQuestion(product.name).includes(normalizedName)
    ) ||
    products.find((product) =>
      normalizedName.includes(normalizeQuestion(product.name))
    ) ||
    null
  );
};

const getCommandValue = (question: string, keys: string[]) => {
  const escapedKeys = keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const stopWords = [
    " sku",
    " category",
    " supplier",
    " quantity",
    " qty",
    " price",
    " low stock",
    " low_stock_limit",
    " limit",
    " warehouse",
    " shelf",
    " rack",
    " bin",
    " location",
    " description",
    " email",
    " phone",
    " address",
  ].join("|");

  for (const key of escapedKeys) {
    const match = question.match(
      new RegExp(`\\b${key}\\s*[:=]?\\s*(\"[^\"]+\"|'[^']+'|.+?)(?=${stopWords}|$)`, "i")
    );

    if (match?.[1]) {
      return match[1].replace(/^["']|["']$/g, "").trim();
    }
  }

  return "";
};

const getNumberCommandValue = (
  question: string,
  keys: string[],
  fallback = 0
) => {
  const value = getCommandValue(question, keys);
  const number = Number(String(value).replace(/[^\d.]/g, ""));

  return Number.isFinite(number) ? number : fallback;
};

const getNameAfterCommand = (question: string, commandPattern: RegExp) => {
  const match = question.match(commandPattern);
  const raw = match?.[1] || "";

  return raw
    .replace(
      /\s+(sku|category|supplier|quantity|qty|price|low stock|low_stock_limit|limit|warehouse|shelf|rack|bin|location|description|email|phone|address)\b.*$/i,
      ""
    )
    .replace(/^named\s+/i, "")
    .trim();
};

const buildProductPayloadFromCommand = (
  question: string
): ProductInput | null => {
  const addPatterns = [
    /\b(?:add|create|register)\s+(?:a\s+|an\s+)?(?:new\s+)?(?:product|item)(?:\s+named|\s+called)?\s+(.+)$/i,
    /\b(?:add|create|register)\s+(.+?)\s+(?:as\s+)?(?:a\s+|an\s+)?(?:new\s+)?(?:product|item)\b/i,
    /\b(?:add|create|register)\s+(.+?)\s+to\s+(?:the\s+)?inventory\b/i,
  ];
  const name = addPatterns
    .map((pattern) => getNameAfterCommand(question, pattern))
    .find(Boolean) || "";

  if (!name) return null;

  return {
    name,
    sku:
      getCommandValue(question, ["sku", "code"]) ||
      `SKU-${Date.now().toString().slice(-6)}`,
    category: getCommandValue(question, ["category"]) || "Uncategorized",
    supplier: getCommandValue(question, ["supplier"]) || "",
    quantity: getNumberCommandValue(question, ["quantity", "qty"], 0),
    price: getNumberCommandValue(question, ["price"], 0),
    low_stock_limit: getNumberCommandValue(
      question,
      ["low stock", "low_stock_limit", "limit"],
      1
    ),
    image_url: "",
    warehouse: getCommandValue(question, ["warehouse"]),
    shelf: getCommandValue(question, ["shelf"]),
    rack: getCommandValue(question, ["rack"]),
    bin: getCommandValue(question, ["bin"]),
  };
};

const handleProductCommand = async (
  question: string,
  products: Product[]
): Promise<AIResponse | null> => {
  const normalizedQuestion = normalizeQuestion(question);

  if (
    includesAny(normalizedQuestion, [
      "add product",
      "add a product",
      "add new product",
      "add a new product",
      "add item",
      "add an item",
      "create product",
      "create a product",
      "create item",
      "register product",
      "register item",
      "new product",
      "new item",
      "to inventory",
    ])
  ) {
    const denied = await getPermissionDeniedResponse("inventory:create");
    if (denied) return denied;

    const payload = buildProductPayloadFromCommand(question);

    if (!payload?.name) {
      return reply(
        "I can add a product, but I need at least the product name. Try: Add product Paper sku PAP-001 category Supplies quantity 20 price 10 low stock 5 warehouse A shelf B1.",
        [routeAction("Open Inventory", "/inventory")]
      );
    }

    const { data, error } = await supabase
      .from("products")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return reply(`I could not add the product. ${error.message}`);
    }

    const { error: auditError } = await addAuditLog({
      action: "Product Added",
      module: "Inventory",
      description: `${data.name} was added to the inventory through the AI assistant with ${data.quantity} unit(s).`,
    });

    requestProductRefresh({ type: "upsert", product: data });

    return {
      text: `Added ${data.name} to inventory with ${data.quantity} unit(s). SKU: ${
        data.sku || "N/A"
      }.${auditError ? " The product was saved, but its audit entry could not be created." : ""}`,
      shouldRefreshProducts: true,
      actions: [
        routeAction("Open Inventory", "/inventory"),
        routeAction("Stock In", "/stock-in"),
      ],
    };
  }

  if (
    includesAny(normalizedQuestion, [
      "delete product",
      "remove product",
      "delete item",
    ])
  ) {
    const denied = await getPermissionDeniedResponse("inventory:delete");
    if (denied) return denied;

    const name = getNameAfterCommand(
      question,
      /\b(?:delete|remove)\s+(?:(?:the|a)\s+)?(?:product|item)?\s*(.+)$/i
    );
    const product = findProductByCommandName(name, products);

    if (!product) {
      return reply(
        `I could not find "${name || "that product"}" in inventory. Use the exact product name, like: Delete product Mouse.`,
        [routeAction("Open Inventory", "/inventory")]
      );
    }

    const { error } = await supabase.from("products").delete().eq("id", product.id);

    if (error) {
      return reply(`I could not delete ${product.name}. ${error.message}`);
    }

    await deleteStoredImage(product.image_url);

    const { error: auditError } = await addAuditLog({
      action: "Product Deleted",
      module: "Inventory",
      description: `${product.name} was deleted from the inventory through the AI assistant.`,
    });

    requestProductRefresh({ type: "remove", id: product.id });

    return {
      text: `Deleted ${product.name} from inventory.${
        auditError ? " Its audit entry could not be created." : ""
      }`,
      shouldRefreshProducts: true,
      actions: [routeAction("Open Inventory", "/inventory")],
    };
  }

  if (
    includesAny(normalizedQuestion, [
      "assign location",
      "set location",
      "change location",
    ])
  ) {
    const denied = await getPermissionDeniedResponse("inventory:update");
    if (denied) return denied;

    const name = getNameAfterCommand(
      question,
      /\b(?:assign|set|change)\s+location\s+(?:for|of|to)?\s*(.+)$/i
    );
    const product = findProductByCommandName(name, products);

    if (!product) {
      return reply(
        "I need the product name to assign a location. Try: Assign location Mouse warehouse A shelf B rack C bin 01.",
        [routeAction("Open Inventory", "/inventory")]
      );
    }

    const locationUpdate = {
      warehouse: getCommandValue(question, ["warehouse"]) || product.warehouse || "",
      shelf: getCommandValue(question, ["shelf"]) || product.shelf || "",
      rack: getCommandValue(question, ["rack"]) || product.rack || "",
      bin: getCommandValue(question, ["bin"]) || product.bin || "",
    };

    const { data, error } = await supabase
      .from("products")
      .update(locationUpdate)
      .eq("id", product.id)
      .select()
      .single();

    if (error) {
      return reply(`I could not update ${product.name}'s location. ${error.message}`);
    }

    const locationText = [
      locationUpdate.warehouse,
      locationUpdate.shelf,
      locationUpdate.rack,
      locationUpdate.bin,
    ]
      .filter(Boolean)
      .join(" / ") || "Not assigned";
    const { error: auditError } = await addAuditLog({
      action: "Product Location Updated",
      module: "Inventory",
      description: `${product.name}'s location was changed to ${locationText} through the AI assistant.`,
    });

    requestProductRefresh({ type: "upsert", product: data });

    return {
      text: `Updated ${product.name}'s location to ${locationText}.${
        auditError ? " The audit entry could not be created." : ""
      }`,
      shouldRefreshProducts: true,
      actions: [routeAction("Open Inventory", "/inventory")],
    };
  }

  if (
    includesAny(normalizedQuestion, [
      "edit product",
      "edit a product",
      "update product",
      "update a product",
      "change product",
      "change a product",
    ])
  ) {
    const denied = await getPermissionDeniedResponse("inventory:update");
    if (denied) return denied;

    const name = getNameAfterCommand(
      question,
      /\b(?:edit|update|change)\s+(?:a\s+|the\s+)?product\s+(.+)$/i
    );
    const product = findProductByCommandName(name, products);

    if (!product) {
      return reply(
        "I need the exact product name to edit it. Try: Edit product Mouse price 450 quantity 8 category Accessories.",
        [routeAction("Open Inventory", "/inventory")]
      );
    }

    const updates: Partial<ProductInput> = {};
    const textFields: Array<[keyof ProductInput, string[]]> = [
      ["name", ["name"]],
      ["sku", ["sku", "code"]],
      ["category", ["category"]],
      ["supplier", ["supplier"]],
      ["warehouse", ["warehouse"]],
      ["shelf", ["shelf"]],
      ["rack", ["rack"]],
      ["bin", ["bin"]],
    ];

    textFields.forEach(([field, keys]) => {
      const value = getCommandValue(question, keys);
      if (value) updates[field] = value as never;
    });

    const numberFields: Array<[keyof ProductInput, string[]]> = [
      ["quantity", ["quantity", "qty"]],
      ["price", ["price"]],
      ["low_stock_limit", ["low stock", "low_stock_limit", "limit"]],
    ];

    numberFields.forEach(([field, keys]) => {
      const value = getCommandValue(question, keys);
      if (value) updates[field] = Number(String(value).replace(/[^\d.]/g, "")) as never;
    });

    if (!Object.keys(updates).length) {
      return reply(
        "Tell me what to change. Example: Edit product Mouse price 450 quantity 8 low stock 5.",
        [routeAction("Open Inventory", "/inventory")]
      );
    }

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", product.id)
      .select()
      .single();

    if (error) {
      return reply(`I could not update ${product.name}. ${error.message}`);
    }

    const changedFields = Object.keys(updates).join(", ");
    const { error: auditError } = await addAuditLog({
      action: "Product Updated",
      module: "Inventory",
      description: `${product.name} was updated through the AI assistant. Changed fields: ${changedFields}.`,
    });

    requestProductRefresh({ type: "upsert", product: data });

    return {
      text: `Updated ${product.name}. Changed: ${changedFields}.${
        auditError ? " The audit entry could not be created." : ""
      }`,
      shouldRefreshProducts: true,
      actions: [routeAction("Open Inventory", "/inventory")],
    };
  }

  if (
    includesAny(normalizedQuestion, [
      "stock in",
      "add stock",
      "stock out",
      "remove stock",
    ])
  ) {
    const denied = await getPermissionDeniedResponse("stock:move");
    if (denied) return denied;

    const isStockOut =
      normalizedQuestion.includes("stock out") ||
      normalizedQuestion.includes("remove stock");
    const name = getNameAfterCommand(
      question,
      isStockOut
        ? /\b(?:stock out|remove stock)\s+(.+)$/i
        : /\b(?:stock in|add stock)\s+(.+)$/i
    );
    const product = findProductByCommandName(name, products);
    const quantity = getNumberCommandValue(question, ["quantity", "qty"], 0);

    if (!product || quantity <= 0) {
      return reply(
        `I need a product name and quantity. Try: ${
          isStockOut ? "Stock out Mouse quantity 2" : "Stock in Mouse quantity 10"
        }.`,
        [routeAction(isStockOut ? "Open Stock Out" : "Open Stock In", isStockOut ? "/stock-out" : "/stock-in")]
      );
    }

    const newQuantity = isStockOut
      ? Number(product.quantity) - quantity
      : Number(product.quantity) + quantity;

    if (newQuantity < 0) {
      return reply(
        `I cannot remove ${quantity} unit(s) from ${product.name} because only ${product.quantity} unit(s) are available.`
      );
    }

    const { data, error } = await supabase
      .from("products")
      .update({ quantity: newQuantity })
      .eq("id", product.id)
      .select()
      .single();

    if (error) {
      return reply(`I could not update stock for ${product.name}. ${error.message}`);
    }

    await supabase.from("stock_transactions").insert([
      {
        product_id: product.id,
        product_name: product.name,
        type: isStockOut ? "stock_out" : "stock_in",
        quantity,
        remarks: "Updated by AI assistant command",
      },
    ]);

    const { error: auditError } = await addAuditLog({
      action: isStockOut ? "Stock Out" : "Stock In",
      module: "Stock",
      description: `${quantity} unit(s) ${
        isStockOut ? "removed from" : "added to"
      } ${product.name} through the AI assistant. New quantity: ${newQuantity}.`,
    });

    requestProductRefresh({ type: "upsert", product: data });

    return {
      text: `${isStockOut ? "Removed" : "Added"} ${quantity} unit(s) ${
        isStockOut ? "from" : "to"
      } ${product.name}. New quantity: ${newQuantity}.${
        auditError ? " The audit entry could not be created." : ""
      }`,
      shouldRefreshProducts: true,
      actions: [
        routeAction("Open Inventory", "/inventory"),
        routeAction("Stock History", "/stock-history"),
      ],
    };
  }

  return null;
};

const getRequestedQuantity = (question: string) => {
  const match = question.match(/\b(\d+)\s*(?:units?|pcs|pieces?|items?)?\b/i);

  return match ? Number(match[1]) : null;
};

const getCurrentUserProfile = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (!user) {
    return {
      user: null,
      profile: null,
      error: null,
    };
  }

  let profile: UserProfile | null = null;
  let profileError: unknown = null;

  const profileById = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileById.data) {
    profile = profileById.data;
  } else {
    profileError = profileById.error;
  }

  if (!profile && user.email) {
    const profileByEmail = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status")
      .eq("email", user.email)
      .maybeSingle();

    if (profileByEmail.data) {
      profile = profileByEmail.data;
      profileError = null;
    } else {
      profileError = profileByEmail.error || profileError;
    }
  }

  return {
    user,
    profile,
    error: profileError,
  };
};

const getPermissionDeniedResponse = async (
  permission: Permission
): Promise<AIResponse | null> => {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    return reply("Please sign in before asking me to change system records.");
  }

  if (!hasPermission(profile?.role, permission)) {
    return reply(
      `Your ${profile?.role || "Viewer"} role does not have permission to perform that action.`,
      [routeAction("Open Profile", "/profile")]
    );
  }

  return null;
};

const handleManagementCommand = async (
  question: string,
  products: Product[]
): Promise<AIResponse | null> => {
  const q = normalizeQuestion(question);

  if (/\b(?:add|create)\s+(?:a\s+)?(?:new\s+)?category\b/i.test(question)) {
    const denied = await getPermissionDeniedResponse("categories:manage");
    if (denied) return denied;

    const name = getNameAfterCommand(
      question,
      /\b(?:add|create)\s+(?:a\s+)?(?:new\s+)?category(?:\s+named|\s+called)?\s+(.+)$/i
    );
    if (!name) {
      return reply(
        "Tell me the category name. Example: Add category Office Supplies description Everyday office items.",
        [routeAction("Open Categories", "/categories")]
      );
    }

    const description = getCommandValue(question, ["description"]);
    const { error } = await addCategory({ name, description });
    if (error) return reply(`I could not add category ${name}. ${error.message}`);

    await addAuditLog({
      action: "Category Added",
      module: "Categories",
      description: `${name} was added through the AI assistant.`,
    });
    return reply(`Added ${name} to Categories.`, [
      routeAction("Open Categories", "/categories"),
    ]);
  }

  if (/\b(?:delete|remove)\s+(?:the\s+)?category\b/i.test(question)) {
    const denied = await getPermissionDeniedResponse("categories:manage");
    if (denied) return denied;

    const name = getNameAfterCommand(
      question,
      /\b(?:delete|remove)\s+(?:the\s+)?category\s+(.+)$/i
    );
    const { data } = await getCategories();
    const category = (data || []).find(
      (item) => normalizeQuestion(item.name) === normalizeQuestion(name)
    );
    if (!category) return reply(`I could not find category "${name}".`);

    const { error } = await deleteCategory(category.id);
    if (error) return reply(`I could not delete ${category.name}. ${error.message}`);
    await addAuditLog({
      action: "Category Deleted",
      module: "Categories",
      description: `${category.name} was deleted through the AI assistant.`,
    });
    return reply(`Deleted category ${category.name}.`);
  }

  if (/\b(?:add|create)\s+(?:a\s+)?(?:new\s+)?supplier\b/i.test(question)) {
    const denied = await getPermissionDeniedResponse("suppliers:manage");
    if (denied) return denied;

    const name = getNameAfterCommand(
      question,
      /\b(?:add|create)\s+(?:a\s+)?(?:new\s+)?supplier(?:\s+named|\s+called)?\s+(.+)$/i
    );
    if (!name) {
      return reply(
        "Tell me the supplier name. You may include email, phone, and address.",
        [routeAction("Open Suppliers", "/suppliers")]
      );
    }

    const supplier = {
      name,
      email: getCommandValue(question, ["email"]),
      phone: getCommandValue(question, ["phone"]),
      address: getCommandValue(question, ["address"]),
    };
    const { error } = await addSupplier(supplier);
    if (error) return reply(`I could not add supplier ${name}. ${error.message}`);
    await addAuditLog({
      action: "Supplier Added",
      module: "Suppliers",
      description: `${name} was added through the AI assistant.`,
    });
    return reply(`Added ${name} to Suppliers.`, [
      routeAction("Open Suppliers", "/suppliers"),
    ]);
  }

  if (/\b(?:delete|remove)\s+(?:the\s+)?supplier\b/i.test(question)) {
    const denied = await getPermissionDeniedResponse("suppliers:manage");
    if (denied) return denied;

    const name = getNameAfterCommand(
      question,
      /\b(?:delete|remove)\s+(?:the\s+)?supplier\s+(.+)$/i
    );
    const { data } = await getSuppliers();
    const supplier = (data || []).find(
      (item) => normalizeQuestion(item.name) === normalizeQuestion(name)
    );
    if (!supplier) return reply(`I could not find supplier "${name}".`);

    const { error } = await deleteSupplier(supplier.id);
    if (error) return reply(`I could not delete ${supplier.name}. ${error.message}`);
    await addAuditLog({
      action: "Supplier Deleted",
      module: "Suppliers",
      description: `${supplier.name} was deleted through the AI assistant.`,
    });
    return reply(`Deleted supplier ${supplier.name}.`);
  }

  if (includesAny(q, ["mark all notifications read", "mark all alerts read"])) {
    const denied = await getPermissionDeniedResponse("alerts:view");
    if (denied) return denied;

    const { data, error } = await getNotifications();
    if (error) return reply(`I could not load notifications. ${error.message}`);
    const unread = (data || []).filter((item) => item.status === "Unread");
    await Promise.all(
      unread.map((item) => updateNotificationStatus(item.id, "Read"))
    );
    return reply(
      unread.length
        ? `Marked ${unread.length} notification(s) as read.`
        : "You have no unread notifications.",
      [routeAction("Open Alerts", "/notifications")]
    );
  }

  if (includesAny(q, ["generate low stock alerts", "create low stock alerts"])) {
    const denied = await getPermissionDeniedResponse("alerts:view");
    if (denied) return denied;

    const lowStock = products.filter(
      (product) => product.quantity <= product.low_stock_limit
    );
    if (!lowStock.length) return reply("No products currently need a low-stock alert.");

    await Promise.all(
      lowStock.map((product) =>
        addNotification({
          title: "Low Stock Alert",
          message: `${product.name} is low on stock. Current quantity: ${product.quantity}.`,
          type: "warning",
          status: "Unread",
        })
      )
    );
    await addAuditLog({
      action: "Low Stock Alerts Generated",
      module: "Notifications",
      description: `${lowStock.length} low-stock alert(s) were generated through the AI assistant.`,
    });
    return reply(`Generated ${lowStock.length} low-stock alert(s).`, [
      routeAction("Open Alerts", "/notifications"),
    ]);
  }

  return null;
};

const getUserIdentityResponse = async () => {
  const { user, profile, error } = await getCurrentUserProfile();

  if (!user) {
    return "I cannot identify you yet because there is no active signed-in session. Please sign in first, then ask me again.";
  }

  if (!profile) {
    return `You are signed in as ${
      user.email || "the current StockFlow user"
    }. I could not find a matching profile record in the profiles table${
      error ? " yet" : ""
    }, so your role and status are not available from the user database right now.`;
  }

  return `You are ${profile.full_name || "a StockFlow user"}${
    profile.email || user.email ? ` (${profile.email || user.email})` : ""
  }. Your role is ${profile.role || "not set"} and your account status is ${
    profile.status || "not set"
  }.`;
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

const getLocalInventoryResponse = async (
  question: string,
  products: Product[]
) => {
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
  const assistantData = await getAssistantData(products);
  const { stockMovements, auditLogs, suppliers } = assistantData;
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

  if (isUserIdentityQuestion(question)) {
    return await getUserIdentityResponse();
  }

  if (isIdentityQuestion(question)) {
    return "I am your StockFlow AI Inventory Assistant. I help you understand your inventory faster by answering questions about products, stock levels, low-stock alerts, suppliers, categories, locations, reports, QR/barcode tools, audits, and restocking. I use your StockFlow data when it is available, and I will tell you when something needs backend data or a page action.";
  }

  if (isCapabilityQuestion(question)) {
    return withDefaultActions(
      "I can help with StockFlow questions about available stocks, low-stock and out-of-stock products, total products, inventory value, suppliers, categories, product locations, SKU details, restock suggestions, stock in/out actions, reports, QR/barcode tools, audit logs, and notifications."
    );
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
    const movedProductNames = new Set(
      stockMovements
        .map((movement) => normalizeQuestion(movement.product_name || ""))
        .filter(Boolean)
    );
    const nonMovingProducts = products.filter(
      (product) => !movedProductNames.has(normalizeQuestion(product.name))
    );
    const reviewProducts = (nonMovingProducts.length
      ? nonMovingProducts
      : products
    )
      .sort(
        (a, b) =>
          Number(b.quantity) * Number(b.price) -
          Number(a.quantity) * Number(a.price)
      )
      .slice(0, 5);

    if (!stockMovements.length) {
      return reply(
        reviewProducts.length
          ? `I need stock movement history to confirm zero movement. From current inventory value alone, these products may be worth reviewing: ${reviewProducts
              .map((item) => `${item.name} (${item.quantity} units, ${formatCurrency(Number(item.quantity) * Number(item.price))})`)
              .join(", ")}.`
          : "I need product and movement data to identify non-moving stock.",
        [routeAction("Open Stock History", "/stock-history")]
      );
    }

    return reply(
      nonMovingProducts.length
        ? `Based on the current stock movement records I can access, these products have no recent movement in the loaded history: ${reviewProducts
            .map((item) => `${item.name} (${item.quantity} units, ${formatCurrency(Number(item.quantity) * Number(item.price))} tied up)`)
            .join(", ")}.`
        : "All products appear in the loaded stock movement history. For a stricter date range, review Stock History or Reports.",
      [routeAction("Open Stock History", "/stock-history")]
    );
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
    const recentAuditLogs = auditLogs.slice(0, 5);

    return reply(
      recentAuditLogs.length
        ? `I checked the loaded audit trail. Recent activity includes: ${recentAuditLogs
            .map((log) => `${log.action || "Action"} in ${log.module || "system"}: ${log.description || "No description"}${log.created_at ? ` (${new Date(log.created_at).toLocaleString()})` : ""}`)
            .join("; ")}.`
        : "That information belongs in the Audit Trail. I could not load recent audit records in the fallback data, so open the Audit page to review who changed inventory records and when.",
      [routeAction("Open Audit", "/audit-logs")]
    );
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
      return reply(
        `You can view stocks on the Inventory page. Current available products: ${formatProductList(
          availableProducts
        )}.`,
        [routeAction("Open Inventory", "/inventory")]
      );
    }

    if (includesAny(q, ["report", "reports", "csv", "print"])) {
      return reply(
        `Open the Reports page to view, print, or export inventory reports. Quick report summary: ${products.length} products, ${totalStocks} total units, ${formatCurrency(
          inventoryValue
        )} estimated value, and ${lowStock.length} low-stock item(s).`,
        [routeAction("Open Reports", "/reports")]
      );
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
      return reply(
        "Inventory files and exports are handled from the Reports page. Use Export CSV to download inventory data, or Print Report to create a printable copy.",
        [routeAction("Open Reports", "/reports")]
      );
    }

    if (
      includesAny(q, ["audit", "audits", "audit trail", "logs", "activity"])
    ) {
      return reply(
        "Open the Audit Trail page to view system activity logs, including product changes, stock actions, and inventory events.",
        [routeAction("Open Audit", "/audit-logs")]
      );
    }

    if (includesAny(q, ["alert", "alerts", "notification", "notifications"])) {
      return reply(
        lowStock.length
          ? `Open the Notifications page to view alerts. Current low-stock alerts should include: ${lowStock
              .map((item) => item.name)
              .join(", ")}.`
          : "Open the Notifications page to view alerts. There are no low-stock products based on the current inventory data.",
        [routeAction("Open Alerts", "/notifications")]
      );
    }

    if (includesAny(q, ["supplier", "suppliers"])) {
      const suppliers = Array.from(
        new Set(products.map((item) => item.supplier).filter(Boolean))
      );

      return reply(
        suppliers.length
          ? `Open the Suppliers page to manage supplier records. Current suppliers: ${suppliers.join(
              ", "
            )}.`
          : "Open the Suppliers page to manage supplier records. No suppliers are recorded in the current inventory data.",
        [routeAction("Open Suppliers", "/suppliers")]
      );
    }

    if (includesAny(q, ["category", "categories"])) {
      const categories = Array.from(
        new Set(products.map((item) => item.category).filter(Boolean))
      );

      return reply(
        categories.length
          ? `Open the Categories page to manage product groups. Current categories: ${categories.join(
              ", "
            )}.`
          : "Open the Categories page to manage product groups. No categories are recorded in the current inventory data.",
        [routeAction("Open Categories", "/categories")]
      );
    }

    if (includesAny(q, ["qr", "barcode", "scanner", "scan"])) {
      return reply(
        "Open the QR or Barcode tools to generate product QR codes, search by QR data, or scan products faster.",
        [
          routeAction("QR Codes", "/qr-codes"),
          routeAction("QR Search", "/qr-search"),
        ]
      );
    }

    if (includesAny(q, ["restock", "predictor", "recommendation"])) {
      return reply(
        lowStock.length
          ? `Open the Smart Restock Predictor to view restock recommendations. Current low-stock products: ${lowStock
              .map((item) => item.name)
              .join(", ")}.`
          : "Open the Smart Restock Predictor to view recommendations. Right now, no urgent restock is needed based on current quantities.",
        [routeAction("Open Restock", "/restock-predictor")]
      );
    }

    if (includesAny(q, ["dashboard", "home", "command center"])) {
      return reply(
        `Open the Dashboard for the main overview. Current snapshot: ${products.length} products, ${totalStocks} total units, ${formatCurrency(
          inventoryValue
        )} estimated value.`,
        [routeAction("Open Dashboard", "/dashboard")]
      );
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
      const supplierRecord = suppliers.find(
        (supplier) =>
          normalizeQuestion(supplier.name || "") ===
          normalizeQuestion(mentionedProduct.supplier || "")
      );

      return `For ${mentionedProduct.name}, StockFlow shows ${
        mentionedProduct.quantity
      } unit(s) on hand with a reorder point of ${
        mentionedProduct.low_stock_limit
      }. Preferred supplier from your product record: ${
        mentionedProduct.supplier || "not assigned"
      }${
        supplierRecord?.email ? ` (${supplierRecord.email})` : ""
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

  if (
    includesAny(q, [
      "what was stocked in",
      "stocked in today",
      "recent stock in",
      "incoming movements",
      "recent incoming",
    ])
  ) {
    const incoming = stockMovements
      .filter((movement) => String(movement.type || "").toUpperCase() === "IN")
      .slice(0, 6);

    return reply(
      incoming.length
        ? `Recent Stock In records: ${incoming
            .map((movement) => `${movement.product_name || "Product"} +${movement.quantity || 0} unit(s)${movement.created_at ? ` on ${new Date(movement.created_at).toLocaleString()}` : ""}`)
            .join("; ")}.`
        : "I could not find recent Stock In records in the loaded movement data.",
      [routeAction("Open Stock History", "/stock-history")]
    );
  }

  if (
    includesAny(q, [
      "what was stocked out",
      "stocked out today",
      "recent stock out",
      "outgoing movements",
      "recent outgoing",
    ])
  ) {
    const outgoing = stockMovements
      .filter((movement) => String(movement.type || "").toUpperCase() === "OUT")
      .slice(0, 6);

    return reply(
      outgoing.length
        ? `Recent Stock Out records: ${outgoing
            .map((movement) => `${movement.product_name || "Product"} -${movement.quantity || 0} unit(s)${movement.created_at ? ` on ${new Date(movement.created_at).toLocaleString()}` : ""}`)
            .join("; ")}.`
        : "I could not find recent Stock Out records in the loaded movement data.",
      [routeAction("Open Stock History", "/stock-history")]
    );
  }

  if (includesAny(q, ["stock in", "add stock", "incoming stock"])) {
    return reply(
      "Use the Stock In page to add incoming stock. Select a product, enter the quantity to add, add an optional note, then submit Add Stock.",
      [routeAction("Open Stock In", "/stock-in")]
    );
  }

  if (includesAny(q, ["stock out", "remove stock", "outgoing stock"])) {
    return reply(
      "Use the Stock Out page to remove stock from inventory. Select a product, enter the quantity to remove, add a reason or note, then submit Remove Stock.",
      [routeAction("Open Stock Out", "/stock-out")]
    );
  }

  if (includesAny(q, ["add product", "new product", "create product"])) {
    return reply(
      "To add a product, go to Inventory, click Add Product, then enter the product name, SKU, category, supplier, quantity, price, low stock limit, and location details.",
      [routeAction("Add Product", "/inventory/add")]
    );
  }

  if (includesAny(q, ["edit product", "update product", "change product"])) {
    return reply(
      "To edit a product, open the Inventory page, choose the product, click Edit Product, update the fields, and save the changes.",
      [routeAction("Open Inventory", "/inventory")]
    );
  }

  if (includesAny(q, ["delete product", "remove product"])) {
    return reply(
      "To delete a product, open the Inventory page, click Delete Product on the item, and confirm the deletion. Be careful because this removes the record.",
      [routeAction("Open Inventory", "/inventory")]
    );
  }

  if (includesAny(q, ["report", "reports", "export csv", "print"])) {
    return reply(
      "The Reports page shows inventory totals and product report data. You can export a CSV or print the report from there.",
      [routeAction("Open Reports", "/reports")]
    );
  }

  if (includesAny(q, ["qr", "barcode", "scan", "scanner"])) {
    return reply(
      "The QR and barcode tools help you generate product QR codes, search products by QR data, and quickly identify inventory items.",
      [
        routeAction("QR Codes", "/qr-codes"),
        routeAction("QR Search", "/qr-search"),
      ]
    );
  }

  if (includesAny(q, ["audit", "logs", "audit trail", "activity"])) {
    return reply(
      "The Audit Trail records system activity like product changes, stock actions, and important inventory events for monitoring.",
      [routeAction("Open Audit", "/audit-logs")]
    );
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

  return getUnknownQuestionResponse(products);
};

export const getAIInventoryResponse = async (
  question: string,
  products: Product[],
  history: ChatMessage[] = [],
  userContext: AIUserContext = {}
): Promise<AIResponse> => {
  const managementResponse = await handleManagementCommand(question, products);

  if (managementResponse) {
    return toAIResponse(managementResponse);
  }

  const commandResponse = await handleProductCommand(question, products);

  if (commandResponse) {
    return toAIResponse(commandResponse);
  }

  if (isCcdAssetRequest(question)) {
    return toAIResponse(getCcdAssetResponse(question));
  }

  if (isImageGenerationQuestion(question)) {
    return toAIResponse(await generateInventoryImage(question));
  }

  if (!API_BASE_URL) {
    if (isWebSearchQuestion(question)) {
      return reply(
        "I need the backend web-search service to answer that, but the frontend does not have VITE_API_BASE_URL configured. Set it to your Render backend URL, then redeploy the frontend.",
        [routeAction("Open Inventory", "/inventory")]
      );
    }

    return toAIResponse(await getLocalInventoryResponse(question, products));
  }

  if (isUserIdentityQuestion(question)) {
    return toAIResponse(await getLocalInventoryResponse(question, products));
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
        userContext,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message || `AI backend failed with status ${response.status}.`
      );
    }

    return data?.answer?.trim()
      ? reply(data.answer.trim())
      : getUnknownQuestionResponse(products);
  } catch (error) {
    console.warn("AI backend unavailable, using local fallback.", error);

    if (isWebSearchQuestion(question)) {
      const errorMessage =
        error instanceof Error ? ` Backend message: ${error.message}` : "";

      return reply(
        `I tried to search the web, but the AI backend could not complete the request.${errorMessage} Please check that your backend is running, TAVILY_API_KEY is set in Render, and VITE_API_BASE_URL points to your Render backend URL.`,
        [routeAction("Open Dashboard", "/dashboard")]
      );
    }

    return toAIResponse(await getLocalInventoryResponse(question, products));
  }
};
