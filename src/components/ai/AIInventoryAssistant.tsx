import {
  type FormEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useProducts } from "../../hooks/useProducts";
import { getAIInventoryResponse } from "../../services/aiService";

type Message = {
  sender: "user" | "ai";
  text: string;
};

type AvatarPosition = {
  x: number;
  y: number;
};

const AVATAR_SIZE = 76;
const AVATAR_MARGIN = 16;

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
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<AvatarPosition | null>(
    null
  );
  const dragRef = useRef({
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const clampAvatarPosition = (position: AvatarPosition): AvatarPosition => {
    if (typeof window === "undefined") return position;

    return {
      x: Math.min(
        Math.max(position.x, AVATAR_MARGIN),
        window.innerWidth - AVATAR_SIZE - AVATAR_MARGIN
      ),
      y: Math.min(
        Math.max(position.y, AVATAR_MARGIN),
        window.innerHeight - AVATAR_SIZE - AVATAR_MARGIN
      ),
    };
  };

  useEffect(() => {
    const savedPosition = window.localStorage.getItem("aiAvatarPosition");

    if (savedPosition) {
      try {
        setAvatarPosition(clampAvatarPosition(JSON.parse(savedPosition)));
        return;
      } catch {
        window.localStorage.removeItem("aiAvatarPosition");
      }
    }

    setAvatarPosition(
      clampAvatarPosition({
        x: window.innerWidth - AVATAR_SIZE - 24,
        y: window.innerHeight - AVATAR_SIZE - 104,
      })
    );
  }, []);

  useEffect(() => {
    if (!avatarPosition) return;

    window.localStorage.setItem(
      "aiAvatarPosition",
      JSON.stringify(avatarPosition)
    );
  }, [avatarPosition]);

  const handleAvatarPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      dragging: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleAvatarPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.dragging) return;

    const distance = Math.hypot(
      e.clientX - dragRef.current.startX,
      e.clientY - dragRef.current.startY
    );

    if (distance > 4) {
      dragRef.current.moved = true;
    }

    setAvatarPosition(
      clampAvatarPosition({
        x: e.clientX - dragRef.current.offsetX,
        y: e.clientY - dragRef.current.offsetY,
      })
    );
  };

  const handleAvatarPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    dragRef.current.dragging = false;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleAvatarClick = () => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }

    setOpen(!open);
  };

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

  const handleAsk = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!question.trim()) return;

    const userMessage: Message = {
      sender: "user",
      text: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setAiError(null);
    setLoadingResponse(true);

    try {
      const aiResponse = await getAIInventoryResponse(question, products);
      const aiMessage: Message = {
        sender: "ai",
        text: aiResponse,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const fallback = answerQuestion(question);
      setAiError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to connect to the AI service."
      );
      const aiMessage: Message = {
        sender: "ai",
        text: fallback,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setLoadingResponse(false);
    }
  };

  return (
    <>
      <button
        className="ai-floating-btn"
        type="button"
        onClick={handleAvatarClick}
        onPointerDown={handleAvatarPointerDown}
        onPointerMove={handleAvatarPointerMove}
        onPointerUp={handleAvatarPointerUp}
        onPointerCancel={handleAvatarPointerUp}
        style={
          avatarPosition
            ? {
                left: avatarPosition.x,
                top: avatarPosition.y,
                right: "auto",
                bottom: "auto",
              }
            : undefined
        }
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        <div className="ai-core">
          <div className="ai-ring ring-1"></div>
          <div className="ai-ring ring-2"></div>
          <div className="ai-ring ring-3"></div>

          <div className="ai-sphere">
            <video
              className="ai-avatar-video"
              src="/avatar.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
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

          {aiError ? (
            <div className="ai-error-message">{aiError}</div>
          ) : null}

          <form className="ai-input-row" onSubmit={handleAsk}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask: Which products are low stock?"
              disabled={loadingResponse}
            />

            <button type="submit" disabled={loadingResponse}>
              {loadingResponse ? "Thinking..." : "Ask"}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIInventoryAssistant;
