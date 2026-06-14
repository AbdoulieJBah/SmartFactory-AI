"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import {
  AlertCircle,
  BarChart3,
  Bot,
  Brain,
  ClipboardCheck,
  Factory,
  Gauge,
  Loader2,
  PackageSearch,
  Send,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type AnyRecord = Record<string, any>;

const safeArray = (value: any): AnyRecord[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

function getValue(
  obj: AnyRecord,
  keys: string[],
  fallback: string | number = "-"
) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== "") {
      return obj[key];
    }
  }

  return fallback;
}

function PromptCard({
  title,
  description,
  icon,
  prompt,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
  onClick: (prompt: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(prompt)}
      className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2 text-blue-700">{icon}</div>
        <h3 className="font-semibold text-gray-950">{title}</h3>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  );
}

function MiniKpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="text-blue-700">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-950">{value}</p>
    </div>
  );
}

export default function AICopilotPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState<AnyRecord[]>([]);
  const [orders, setOrders] = useState<AnyRecord[]>([]);
  const [quality, setQuality] = useState<AnyRecord[]>([]);
  const [downtime, setDowntime] = useState<AnyRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm SmartFactory AI Copilot. I can help analyze inventory risks, production orders, OEE, quality, downtime, waste, forecasting, and factory performance using your live MES/ERP data.",
    },
  ]);

  async function loadFactoryContext() {
    try {
      setContextLoading(true);

      const [inventoryRes, ordersRes, qualityRes, downtimeRes] =
        await Promise.allSettled([
          api.get("/inventory/"),
          api.get("/production-orders/"),
          api.get("/quality/"),
          api.get("/downtime/"),
        ]);

      if (inventoryRes.status === "fulfilled") {
        setInventory(safeArray(inventoryRes.value.data));
      }

      if (ordersRes.status === "fulfilled") {
        setOrders(safeArray(ordersRes.value.data));
      }

      if (qualityRes.status === "fulfilled") {
        setQuality(safeArray(qualityRes.value.data));
      }

      if (downtimeRes.status === "fulfilled") {
        setDowntime(safeArray(downtimeRes.value.data));
      }
    } finally {
      setContextLoading(false);
    }
  }

  useEffect(() => {
    loadFactoryContext();
  }, []);

  const lowStockCount = useMemo(() => {
    return inventory.filter((item) => {
      const quantity = Number(getValue(item, ["quantity", "qty", "stock"], "0"));
      const minStock = Number(
        getValue(item, ["min_stock", "minStock", "minimum_stock"], "0")
      );

      return minStock > 0 && quantity <= minStock;
    }).length;
  }, [inventory]);

  const openOrdersCount = useMemo(() => {
    return orders.filter((order) => {
      const status = String(getValue(order, ["status"], "")).toLowerCase();
      return !status.includes("complete");
    }).length;
  }, [orders]);

  const qualityFailures = useMemo(() => {
    return quality.filter((record) => {
      const result = String(getValue(record, ["result"], "")).toLowerCase();
      return result.includes("fail");
    }).length;
  }, [quality]);

  const downtimeMinutes = useMemo(() => {
    return downtime.reduce((sum, record) => {
      return (
        sum +
        Number(getValue(record, ["duration_minutes", "duration"], "0"))
      );
    }, 0);
  }, [downtime]);

  const quickPrompts = [
    {
      title: "Inventory Risk",
      description: "Find products below minimum stock and recommend action.",
      icon: <PackageSearch size={18} />,
      prompt:
        "Which products need replenishment? Give me the risk level and recommended actions.",
    },
    {
      title: "Production Priority",
      description: "Identify orders that require management attention.",
      icon: <Factory size={18} />,
      prompt:
        "Which production orders require attention? Prioritize them by urgency.",
    },
    {
      title: "OEE Analysis",
      description: "Explain availability, performance, quality, and OEE issues.",
      icon: <Gauge size={18} />,
      prompt:
        "Analyze OEE performance and explain what is reducing factory efficiency.",
    },
    {
      title: "Quality Root Cause",
      description: "Review failed checks and possible quality drivers.",
      icon: <ClipboardCheck size={18} />,
      prompt:
        "Why is quality performance changing? Identify likely causes and corrective actions.",
    },
    {
      title: "Downtime Risk",
      description: "Summarize downtime events and maintenance priorities.",
      icon: <Timer size={18} />,
      prompt:
        "Do we have downtime issues? Identify the biggest downtime causes and actions.",
    },
    {
      title: "Executive Summary",
      description: "Generate a management-ready factory performance summary.",
      icon: <BarChart3 size={18} />,
      prompt:
        "Generate an executive summary of factory performance for management.",
    },
  ];

  const askAI = async (directPrompt?: string) => {
    const finalQuestion = directPrompt || question;

    if (!finalQuestion.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: finalQuestion,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError("");
    setQuestion("");

    try {
      const response = await api.post("/ai/ask", {
        question: finalQuestion,
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          response.data.answer ||
          "No response received from SmartFactory AI.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I was unable to process your request. Please check your authentication, role permissions, Gemini API key, or backend configuration.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="fixed left-0 top-0 z-40 h-screen w-72">
        <Sidebar />
      </div>

      <main className="ml-72 min-h-screen p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              SmartFactory AI
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold text-gray-950">
              <Bot className="text-blue-700" />
              AI Manufacturing Copilot
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Ask operational questions across inventory, production, OEE,
              quality, downtime, forecasting, and maintenance.
            </p>
          </div>

          <button
            onClick={loadFactoryContext}
            className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <Sparkles size={16} />
            Refresh Context
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <MiniKpi
            label="Low Stock Risks"
            value={contextLoading ? "..." : lowStockCount}
            icon={<PackageSearch size={18} />}
          />
          <MiniKpi
            label="Open Orders"
            value={contextLoading ? "..." : openOrdersCount}
            icon={<Factory size={18} />}
          />
          <MiniKpi
            label="Quality Failures"
            value={contextLoading ? "..." : qualityFailures}
            icon={<ClipboardCheck size={18} />}
          />
          <MiniKpi
            label="Downtime Minutes"
            value={contextLoading ? "..." : downtimeMinutes}
            icon={<Timer size={18} />}
          />
        </section>

        <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {quickPrompts.map((item) => (
            <PromptCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={item.icon}
              prompt={item.prompt}
              onClick={askAI}
            />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2 flex min-h-[560px] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b p-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950">
                <Brain size={20} className="text-blue-700" />
                Factory Intelligence Chat
              </h2>
              <p className="text-sm text-gray-500">
                Ask questions like: “Which orders are behind schedule?” or “Why
                is OEE dropping?”
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-3xl rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === "assistant" && (
                          <Sparkles
                            size={16}
                            className="mt-1 text-blue-600"
                          />
                        )}

                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3">
                      <Loader2
                        className="animate-spin text-blue-600"
                        size={16}
                      />
                      <span className="text-sm text-gray-600">
                        SmartFactory AI is analyzing live factory data...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t p-4">
              <div className="flex gap-3">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask: Which products need replenishment? Why is OEE dropping? What should we prioritize today?"
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) {
                      askAI();
                    }
                  }}
                />

                <button
                  onClick={() => askAI()}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-950">
                Copilot Capabilities
              </h2>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border p-3">
                  <p className="font-semibold text-gray-950">
                    Inventory Optimization
                  </p>
                  <p className="text-sm text-gray-500">
                    Detect shortages and recommend replenishment actions.
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="font-semibold text-gray-950">
                    Production Prioritization
                  </p>
                  <p className="text-sm text-gray-500">
                    Identify open orders, bottlenecks, and delayed jobs.
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="font-semibold text-gray-950">
                    Quality Root Cause
                  </p>
                  <p className="text-sm text-gray-500">
                    Explain quality failures and recommend corrective actions.
                  </p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="font-semibold text-gray-950">
                    Downtime Intelligence
                  </p>
                  <p className="text-sm text-gray-500">
                    Summarize stoppages and maintenance priorities.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <h3 className="font-bold text-blue-900">
                Example Boardroom Prompt
              </h3>

              <p className="mt-2 text-sm text-blue-700">
                “Generate an executive summary for today’s production,
                inventory risks, OEE, downtime, and quality performance. Include
                actions for the plant manager.”
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}