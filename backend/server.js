import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "StockFlow Backend Running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
  });
});

app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .limit(1);

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }

  res.json({
    success: true,
    message: "Supabase Connected Successfully",
    sample: data,
  });
});

const formatCurrency = (value) =>
  `PHP ${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const compactRows = (rows, mapper, limit = 40) =>
  (rows || []).slice(0, limit).map(mapper).join("\n") || "None.";

const buildInventoryContext = async () => {
  const [{ data: products, error: productsError }, { data: stockMovements }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id,name,sku,category,supplier,quantity,price,low_stock_limit,warehouse,shelf,rack,bin,created_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("stock_movements")
        .select("product_name,type,quantity,note,created_at")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

  if (productsError) {
    throw productsError;
  }

  const productRows = products || [];
  const totalProducts = productRows.length;
  const totalStock = productRows.reduce(
    (sum, product) => sum + Number(product.quantity || 0),
    0
  );
  const inventoryValue = productRows.reduce(
    (sum, product) =>
      sum + Number(product.quantity || 0) * Number(product.price || 0),
    0
  );
  const lowStock = productRows.filter(
    (product) =>
      Number(product.quantity || 0) <= Number(product.low_stock_limit || 0)
  );
  const suppliers = Array.from(
    new Set(productRows.map((product) => product.supplier).filter(Boolean))
  );

  return [
    "LIVE INVENTORY SNAPSHOT",
    `Total products: ${totalProducts}`,
    `Total stock quantity: ${totalStock}`,
    `Estimated inventory value: ${formatCurrency(inventoryValue)}`,
    `Low stock count: ${lowStock.length}`,
    `Suppliers: ${suppliers.length ? suppliers.join(", ") : "None"}`,
    "",
    "PRODUCTS",
    compactRows(productRows, (product) => {
      const location = [
        product.warehouse,
        product.shelf,
        product.rack,
        product.bin,
      ]
        .filter(Boolean)
        .join(" / ");

      return `- ${product.name} | SKU: ${product.sku || "N/A"} | Category: ${
        product.category || "N/A"
      } | Supplier: ${product.supplier || "N/A"} | Qty: ${
        product.quantity
      } | Low limit: ${product.low_stock_limit} | Price: ${formatCurrency(
        product.price
      )} | Location: ${location || "Not assigned"}`;
    }),
    "",
    "LOW STOCK ITEMS",
    compactRows(lowStock, (product) => {
      const recommendedRestock = Math.max(
        Number(product.low_stock_limit || 0) * 2 - Number(product.quantity || 0),
        Number(product.low_stock_limit || 0)
      );

      return `- ${product.name}: ${product.quantity} left, low limit ${
        product.low_stock_limit
      }, suggested restock ${recommendedRestock} units`;
    }),
    "",
    "RECENT STOCK MOVEMENTS",
    compactRows(stockMovements, (movement) => {
      return `- ${movement.product_name}: ${movement.type} ${
        movement.quantity
      } units on ${movement.created_at}. Note: ${movement.note || "None"}`;
    }),
  ].join("\n");
};

/* AI INVENTORY ASSISTANT */

app.post("/ai/inventory-chat", async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "OPENAI_API_KEY is not configured on the backend environment.",
      });
    }

    const inventoryContext = await buildInventoryContext();
    const trimmedHistory = history
      .slice(-8)
      .map((message) => ({
        role: message.sender === "user" ? "user" : "assistant",
        content: String(message.text || "").slice(0, 1000),
      }))
      .filter((message) => message.content);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.25,
        max_output_tokens: 500,
        input: [
          {
            role: "system",
            content:
              "You are StockFlow's AI Inventory Assistant. Be warm, conversational, and helpful. For stock inquiries, low-stock alerts, restocking, reports, analytics, QR/barcode workflows, audit logs, suppliers, categories, and locations, answer using the live inventory context. Match a helpful operations-assistant style: summarize the status, name the affected products, include quantities/SKU/supplier/location when available, and suggest the next StockFlow action. Do not invent order numbers, purchase orders, sales totals, sales velocity, turnover rates, transfer orders, audit usernames, emails, lead times, or warehouse splits if they are not in the context. Do not claim you changed settings or completed an action unless the API actually provides that capability. If data is missing, say exactly what is missing and offer the closest action inside StockFlow. Keep answers concise and actionable.",
          },
          {
            role: "user",
            content: `Inventory context:\n${inventoryContext}`,
          },
          ...trimmedHistory,
          {
            role: "user",
            content: question,
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message:
          data?.error?.message ||
          `OpenAI request failed with status ${response.status}.`,
      });
    }

    const answer =
      data?.output_text ||
      data?.output
        ?.flatMap((item) => item.content || [])
        ?.map((content) => content.text)
        ?.filter(Boolean)
        ?.join("\n")
        ?.trim();

    res.json({
      success: true,
      answer: answer || "I couldn't generate an answer right now.",
    });
  } catch (error) {
    console.error("AI assistant error:", error);

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to generate an AI response.",
    });
  }
});

/* PRODUCTS */

app.get("/products", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }

  res.json(data);
});

app.get("/products/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }

  res.json(data);
});

app.post("/products", async (req, res) => {
  console.log("Incoming Product:");
  console.log(req.body);

  const { data, error } = await supabase
    .from("products")
    .insert([req.body])
    .select();

  if (error) {
    console.error("SUPABASE ERROR:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }

  res.json(data);
});

app.put("/products/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .update(req.body)
    .eq("id", req.params.id)
    .select();

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }

  res.json(data);
});

app.delete("/products/:id", async (req, res) => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", req.params.id);

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }

  res.json({
    success: true,
    message: "Product deleted successfully",
  });
});

/* AUDIT LOGS */

app.get("/audit-logs", async (req, res) => {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }

  res.json(data);
});

app.post("/audit-logs", async (req, res) => {
  const { action, module, description } = req.body;

  const { data, error } = await supabase
    .from("audit_logs")
    .insert([
      {
        action,
        module,
        description,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }

  res.json(data);
});

/* STOCK TRANSACTIONS */

app.post("/stock-in", async (req, res) => {
  const { product_id, quantity, remarks } = req.body;

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .single();

  if (productError) {
    return res.status(500).json({
      success: false,
      message: productError.message,
      error: productError,
    });
  }

  const newQuantity = Number(product.quantity) + Number(quantity);

  const { error: updateError } = await supabase
    .from("products")
    .update({ quantity: newQuantity })
    .eq("id", product_id);

  if (updateError) {
    return res.status(500).json({
      success: false,
      message: updateError.message,
      error: updateError,
    });
  }

  const { error: transactionError } = await supabase
    .from("stock_transactions")
    .insert([
      {
        product_id,
        product_name: product.name,
        type: "stock_in",
        quantity: Number(quantity),
        remarks,
      },
    ]);

  if (transactionError) {
    return res.status(500).json({
      success: false,
      message: transactionError.message,
      error: transactionError,
    });
  }

  res.json({
    success: true,
    message: "Stock added successfully",
    newQuantity,
  });
});

app.post("/stock-out", async (req, res) => {
  const { product_id, quantity, remarks } = req.body;

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .single();

  if (productError) {
    return res.status(500).json({
      success: false,
      message: productError.message,
      error: productError,
    });
  }

  if (Number(product.quantity) < Number(quantity)) {
    return res.status(400).json({
      success: false,
      message: "Not enough stock available",
    });
  }

  const newQuantity = Number(product.quantity) - Number(quantity);

  const { error: updateError } = await supabase
    .from("products")
    .update({ quantity: newQuantity })
    .eq("id", product_id);

  if (updateError) {
    return res.status(500).json({
      success: false,
      message: updateError.message,
      error: updateError,
    });
  }

  const { error: transactionError } = await supabase
    .from("stock_transactions")
    .insert([
      {
        product_id,
        product_name: product.name,
        type: "stock_out",
        quantity: Number(quantity),
        remarks,
      },
    ]);

  if (transactionError) {
    return res.status(500).json({
      success: false,
      message: transactionError.message,
      error: transactionError,
    });
  }

  res.json({
    success: true,
    message: "Stock removed successfully",
    newQuantity,
  });
});

app.get("/stock-history", async (req, res) => {
  const { data, error } = await supabase
    .from("stock_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }

  res.json(data);
});

const PORT = process.env.PORT || 8000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Backend running at http://${HOST}:${PORT}`);
});
