"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import { Bell, AlertTriangle } from "lucide-react";

interface NotificationItem {
  type: string;
  severity: string;
  message: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setError("");
        const res = await api.get("/notifications/");
        setItems(res.data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    fetchNotifications();
  }, []);

  const severityClass = (severity: string) => {
    if (severity === "High") return "bg-red-100 text-red-700";
    if (severity === "Medium") return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bell className="text-blue-600" />
          Notifications
        </h1>

        <p className="text-gray-500 mt-1 mb-6">
          Operational alerts for inventory, production, quality, and downtime.
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-gray-500">
              No notifications found.
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4"
              >
                <AlertTriangle className="text-orange-500 mt-1" />

                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <h2 className="font-semibold">{item.type}</h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${severityClass(
                        item.severity
                      )}`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">{item.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}