import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});