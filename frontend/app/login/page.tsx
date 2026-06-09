"use client";

import { useState } from "react";
import { api, getErrorMessage } from "../lib/api";
import { saveAuth } from "../lib/auth";
import { Factory } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@smartfactory.ai");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/auth/login-json", {
        email,
        password,
      });

      saveAuth(response.data.access_token, response.data.user);

      window.location.href = "/";
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 text-white p-3 rounded-xl">
            <Factory />
          </div>

          <div>
            <h1 className="text-2xl font-bold">SmartFactory AI</h1>
            <p className="text-sm text-gray-500">MES & ERP Login</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              className="w-full border rounded-lg p-3 mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@smartfactory.ai"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input
              className="w-full border rounded-lg p-3 mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              onKeyDown={(e) => {
                if (e.key === "Enter") login();
              }}
            />
          </div>

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-3 rounded-lg font-semibold"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}