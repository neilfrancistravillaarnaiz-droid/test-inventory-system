import type { Product } from "../types/Product";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY?.trim();
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY?.trim();
const HUGGINGFACE_MODEL = import.meta.env.VITE_HUGGINGFACE_MODEL || "gpt2";
const HUGGINGFACE_API_BASE_URL =
  import.meta.env.VITE_HUGGINGFACE_API_BASE_URL ||
  (import.meta.env.DEV ? "/huggingface" : "https://api-inference.huggingface.co");
const HUGGINGFACE_API_FALLBACK_BASE_URL = "https://api-inference.huggingface.com";

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
  const lowStock = products.filter((item) => item.quantity <= item.low_stock_limit);
  const suppliers = Array.from(
    new Set(products.map((item) => item.supplier).filter(Boolean))
  );

  const summary = [
    `Total products: ${totalProducts}.`,
    `Total stock quantity: ${totalStock} units.`,
    `Estimated inventory value: ₱${inventoryValue.toFixed(2)}.`,
    `Suppliers: ${suppliers.length ? suppliers.join(", ") : "None"}.`,
  ];

  if (lowStock.length > 0) {
    summary.push(
      `Low stock items: ${lowStock
        .map((item) => `${item.name} (${item.quantity} left)`)
        .join("; ")}.`
    );
  } else {
    summary.push("No products are currently low on stock.");
  }

  return summary.join(" ");
};

const isOpenAIKey = (key?: string) => Boolean(key && key.startsWith("sk-"));
const isHuggingFaceKey = (key?: string) => Boolean(key && key.startsWith("hf_"));

const getOpenAIInventoryResponse = async (
  question: string,
  inventorySummary: string
): Promise<string> => {
  if (!OPENAI_API_KEY || !isOpenAIKey(OPENAI_API_KEY)) {
    throw new Error(
      "Invalid OpenAI API key. Set VITE_OPENAI_API_KEY to a valid OpenAI key from https://platform.openai.com/account/api-keys."
    );
  }

  const systemPrompt =
    "You are a helpful inventory assistant. Answer the user's question with information derived from the supplied inventory summary only. If the question cannot be answered from the inventory data, say that you don't have enough information.";
  const userPrompt =
    `Inventory summary:\n${inventorySummary}\n\nQuestion: ${question}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 400,
      n: 1,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.error?.message || `OpenAI request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  return text?.trim() || "I couldn't generate a response right now.";
};

const getHuggingFaceInventoryResponse = async (
  question: string,
  inventorySummary: string
): Promise<string> => {
  const hfKey = isHuggingFaceKey(HUGGINGFACE_API_KEY)
    ? HUGGINGFACE_API_KEY
    : isHuggingFaceKey(OPENAI_API_KEY)
    ? OPENAI_API_KEY
    : undefined;

  if (!hfKey) {
    throw new Error(
      "Hugging Face API key is not configured. Set VITE_HUGGINGFACE_API_KEY in your .env file or use a Hugging Face key in VITE_OPENAI_API_KEY."
    );
  }

  const systemPrompt =
    "You are a helpful inventory assistant. Answer the user's question with information derived from the supplied inventory summary only. If the question cannot be answered from the inventory data, say that you don't have enough information.";
  const userPrompt =
    `Inventory summary:\n${inventorySummary}\n\nQuestion: ${question}`;
  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  const body = JSON.stringify({
    inputs: prompt,
    parameters: {
      max_new_tokens: 400,
      temperature: 0.3,
      return_full_text: false,
    },
  });

  const requestUrl = `${HUGGINGFACE_API_BASE_URL}/models/${encodeURIComponent(
    HUGGINGFACE_MODEL
  )}`;

  const parseHuggingFaceError = async (resp: Response) => {
    const errorData = await resp.json().catch(() => null);
    return (
      errorData?.error || errorData?.error?.message || `Hugging Face request failed with status ${resp.status}`
    );
  };

  let response;
  try {
    response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hfKey}`,
      },
      body,
    });
  } catch (error) {
    if (HUGGINGFACE_API_BASE_URL.endsWith(".co")) {
      try {
        response = await fetch(
          `${HUGGINGFACE_API_FALLBACK_BASE_URL}/models/${encodeURIComponent(
            HUGGINGFACE_MODEL
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${hfKey}`,
            },
            body,
          }
        );
      } catch (fallbackError) {
        throw new Error(
          "Unable to reach Hugging Face. Verify that api-inference.huggingface.co is reachable from your network, or set VITE_HUGGINGFACE_API_BASE_URL to a working endpoint."
        );
      }
    } else {
      throw new Error(
        "Unable to reach Hugging Face. Verify your network connectivity or set VITE_HUGGINGFACE_API_BASE_URL to a working endpoint."
      );
    }
  }

  if (!response.ok && HUGGINGFACE_API_BASE_URL.endsWith(".co")) {
    const fallbackResponse = await fetch(
      `${HUGGINGFACE_API_FALLBACK_BASE_URL}/models/${encodeURIComponent(
        HUGGINGFACE_MODEL
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hfKey}`,
        },
        body,
      }
    );

    if (fallbackResponse.ok) {
      response = fallbackResponse;
    } else {
      const fallbackErrorMessage = await parseHuggingFaceError(fallbackResponse);
      throw new Error(
        `Unable to reach Hugging Face: ${fallbackErrorMessage}`
      );
    }
  }

  if (!response.ok) {
    const errorMessage = await parseHuggingFaceError(response);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const text =
    typeof data === "string"
      ? data
      : Array.isArray(data)
      ? data[0]?.generated_text
      : data?.generated_text || data?.generated_text;

  return text?.trim() || "I couldn't generate a response right now.";
};

export const getAIInventoryResponse = async (
  question: string,
  products: Product[]
): Promise<string> => {
  const inventorySummary = buildProductSummary(products);

  if (isOpenAIKey(OPENAI_API_KEY)) {
    return getOpenAIInventoryResponse(question, inventorySummary);
  }

  if (isHuggingFaceKey(OPENAI_API_KEY) || isHuggingFaceKey(HUGGINGFACE_API_KEY)) {
    return getHuggingFaceInventoryResponse(question, inventorySummary);
  }

  throw new Error(
    "Invalid API key. Set VITE_OPENAI_API_KEY to a valid OpenAI key or VITE_HUGGINGFACE_API_KEY to a valid Hugging Face key in your .env file."
  );
};
