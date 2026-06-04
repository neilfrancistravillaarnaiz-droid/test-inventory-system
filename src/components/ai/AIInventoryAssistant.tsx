import { Bot } from "lucide-react";
import { useState } from "react";
import { useProducts } from "../../hooks/useProducts";

type Message = {
  sender: "user" | "ai";
  text: string;
};

const AIInventoryAssistant = () => {
  const { products } = useProducts();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hi! I am your AI Inventory Assistant. Ask me about low stocks, suppliers, products, or restocking.",
    },
  ]);

  const answerQuestion = (input: string) => {
    const q = input.toLowerCase();

    const lowStock = products.filter(
      (item) => item.quantity <= item.low_stock_limit
    );

    const totalStocks = products.reduce((sum, item) => sum + item.quantity, 0);

    const inventoryValue = products.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    if (q.includes("low stock")) {
      if (lowStock.length === 0) {
        return "Great news! No products are currently low on stock.";
      }

      return `These products are low stock: ${lowStock
        .map((item) => `${item.name} (${item.quantity} left)`)
        .join(", ")}.`;
    }

    if (q.includes("total product")) {
      return `You currently have ${products.length} products in your inventory.`;
    }

    if (q.includes("total stock")) {
      return `Your total stock quantity is ${totalStocks} units.`;
    }

    if (q.includes("value") || q.includes("worth")) {
      return `Your estimated inventory value is ₱${inventoryValue.toFixed(2)}.`;
    }

    if (q.includes("supplier")) {
      const suppliers = Array.from(
        new Set(products.map((item) => item.supplier).filter(Boolean))
      );

      return suppliers.length
        ? `Your suppliers are: ${suppliers.join(", ")}.`
        : "No suppliers found in your inventory records.";
    }

    if (q.includes("restock") || q.includes("reorder")) {
      if (lowStock.length === 0) {
        return "No urgent restock is needed right now.";
      }

      return `Recommended restock: ${lowStock
        .map(
          (item) =>
            `${item.name}: add at least ${
              item.low_stock_limit * 2 - item.quantity
            } units`
        )
        .join(", ")}.`;
    }

    const foundProduct = products.find((item) =>
      q.includes(item.name.toLowerCase())
    );

    if (foundProduct) {
      return `${foundProduct.name}: ${foundProduct.quantity} units available, category: ${foundProduct.category}, supplier: ${
        foundProduct.supplier || "N/A"
      }, price: ₱${Number(foundProduct.price).toFixed(2)}.`;
    }

    return "I can answer questions about low stock, total products, total stocks, inventory value, suppliers, restocking, or a specific product name.";
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) return;

    const userMessage: Message = {
      sender: "user",
      text: question,
    };

    const aiMessage: Message = {
      sender: "ai",
      text: answerQuestion(question),
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setQuestion("");
  };

  return (
    <>
      <button
  className="ai-floating-btn"
  type="button"
  onClick={() => setOpen(!open)}
>
  <div className="ai-core">
    <div className="ai-ring ring-1"></div>
    <div className="ai-ring ring-2"></div>
    <div className="ai-ring ring-3"></div>

    <div className="ai-sphere">
      🤖
    </div>
  </div>
</button>

      {open && (
        <div className="ai-panel">
          <div className="ai-header">
            <div>
              <h3>AI Inventory Assistant</h3>
              <p>Ask inventory questions instantly.</p>
            </div>

            <button type="button" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="ai-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.sender === "ai" ? "ai-message ai" : "ai-message user"
                }
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form className="ai-input-row" onSubmit={handleAsk}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask: Which products are low stock?"
            />

            <button type="submit">Ask</button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIInventoryAssistant;