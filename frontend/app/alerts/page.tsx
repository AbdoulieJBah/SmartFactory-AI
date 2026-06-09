"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import { BellRing, AlertTriangle } from "lucide-react";

interface AlertItem {
  type: string;
  severity: string;
  message: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    try {
      setError("");
      const res = await api.get("/alerts/");
      setAlerts(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const severityClass = (severity: string) => {
    if (severity === "High") return "bg-red-100 text-red-700";
    if (severity === "Medium") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <BellRing className="text-red-600" />
            Alerts Center
          </h1>

          <p className="text-gray-500 mt-2">
            High-priority operational alerts for inventory, production, and quality.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-gray-500">
              No active alerts found.
            </div>
          ) : (
            alerts.map((alert, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4"
              >
                <div className="bg-orange-50 text-orange-600 p-3 rounded-xl">
                  <AlertTriangle size={22} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold">{alert.type}</h2>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${severityClass(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}