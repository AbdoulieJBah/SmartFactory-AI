"use client";

import { useState } from "react";
import { api, getErrorMessage } from "../lib/api";
import { saveAuth } from "../lib/auth";
import { Factory } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!fullName || !companyName || !email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/register", {
        full_name: fullName,
        company_name: companyName,
        email,
        password,
      });

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
            <p className="text-sm text-gray-500">Create your company account</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Your name</label>
            <input
              className="w-full border rounded-lg p-3 mt-1"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Company name</label>
            <input
              className="w-full border rounded-lg p-3 mt-1"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Jane Foods Ltd"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              className="w-full border rounded-lg p-3 mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
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
                if (e.key === "Enter") register();
              }}
            />
          </div>

          <button
            onClick={register}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-3 rounded-lg font-semibold"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
