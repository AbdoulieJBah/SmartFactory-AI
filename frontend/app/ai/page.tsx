"use client";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AICopilotPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm SmartFactory AI Copilot. Ask me about inventory, production orders, forecasting, downtime, quality, maintenance, or factory performance.",
    },
  ]);

  const askAI = async () => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError("");

    const currentQuestion = question;
    setQuestion("");

    try {
      const response = await api.post("/ai/ask", {
        question: currentQuestion,
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          response.data.answer ||
          "No response received from SmartFactory AI.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(getErrorMessage(err));

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I was unable to process your request. Please check your authentication or backend configuration.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="text-blue-600" />
            SmartFactory AI Copilot
          </h1>

          <p className="text-gray-500 mt-1">
            AI-powered manufacturing assistant using Gemini and live factory
            data.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-y-auto mb-4">
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
                  className={`max-w-3xl px-4 py-3 rounded-2xl ${
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
                <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2
                    className="animate-spin text-blue-600"
                    size={16}
                  />
                  <span className="text-sm text-gray-600">
                    SmartFactory AI is thinking...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex gap-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about inventory, forecasting, downtime, quality, maintenance..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  askAI();
                }
              }}
            />

            <button
              onClick={askAI}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-3 rounded-lg flex items-center gap-2"
            >
              <Send size={16} />
              Send
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() =>
                setQuestion("Do we have any inventory risks?")
              }
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full"
            >
              Inventory Risks
            </button>

            <button
              onClick={() =>
                setQuestion("What production orders require attention?")
              }
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full"
            >
              Production Orders
            </button>

            <button
              onClick={() =>
                setQuestion("Summarize factory performance")
              }
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full"
            >
              Factory Summary
            </button>

            <button
              onClick={() =>
                setQuestion("Do we have downtime issues?")
              }
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full"
            >
              Downtime Analysis
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}