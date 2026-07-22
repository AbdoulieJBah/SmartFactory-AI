"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle,
  Clock,
  Factory,
  Filter,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";

interface NotificationItem {
  title?: string;
  type: string;
  severity: string;
  message: string;
}

type SeverityFilter = "All" | "High" | "Medium" | "Low";

function severityClass(severity: string) {
  const s = severity.toLowerCase();

  if (s.includes("high")) {
    return {
      badge: "bg-red-100 text-red-700",
      card: "border-red-200 bg-red-50",
      icon: "text-red-600 bg-red-100",
      label: "Critical",
    };
  }

  if (s.includes("medium")) {
    return {
      badge: "bg-orange-100 text-orange-700",
      card: "border-orange-200 bg-orange-50",
      icon: "text-orange-600 bg-orange-100",
      label: "Warning",
    };
  }

  return {
    badge: "bg-blue-100 text-blue-700",
    card: "border-blue-200 bg-blue-50",
    icon: "text-blue-600 bg-blue-100",
    label: "Info",
  };
}

function typeIcon(type: string) {
  const t = type.toLowerCase();

  if (t.includes("inventory")) return <PackageSearch size={18} />;
  if (t.includes("production")) return <Factory size={18} />;
  if (t.includes("quality")) return <ShieldAlert size={18} />;
  if (t.includes("downtime")) return <Clock size={18} />;

  return <AlertTriangle size={18} />;
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-950">{value}</h2>
        </div>

        <div className={`rounded-xl p-2 ${tone}`}>{icon}</div>
      </div>

      <p className="mt-3 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<SeverityFilter>("All");
  const [search, setSearch] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/notifications/");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const highCount = useMemo(
    () => items.filter((item) => item.severity?.toLowerCase() === "high").length,
    [items]
  );

  const mediumCount = useMemo(
    () =>
      items.filter((item) => item.severity?.toLowerCase() === "medium").length,
    [items]
  );

  const lowCount = useMemo(
    () => items.filter((item) => item.severity?.toLowerCase() === "low").length,
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSeverity =
        severity === "All" ||
        item.severity?.toLowerCase() === severity.toLowerCase();

      const q = search.toLowerCase();

      const matchesSearch =
        !q ||
        item.type?.toLowerCase().includes(q) ||
        item.severity?.toLowerCase().includes(q) ||
        item.message?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q);

      return matchesSeverity && matchesSearch;
    });
  }, [items, severity, search]);

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="ml-72 min-h-screen p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              SmartFactory AI
            </p>

            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold text-gray-950">
              <BellRing className="text-blue-700" />
              Real-Time Notifications Center
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Operational alerts for inventory, production, quality, downtime, and factory risk.
            </p>
          </div>

          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard
            title="Total Alerts"
            value={items.length}
            subtitle="All active notifications"
            icon={<Bell size={18} />}
            tone="bg-blue-50 text-blue-700"
          />

          <SummaryCard
            title="Critical"
            value={highCount}
            subtitle="Immediate management attention"
            icon={<AlertTriangle size={18} />}
            tone="bg-red-50 text-red-700"
          />

          <SummaryCard
            title="Warning"
            value={mediumCount}
            subtitle="Requires follow-up"
            icon={<ShieldAlert size={18} />}
            tone="bg-orange-50 text-orange-700"
          />

          <SummaryCard
            title="Information"
            value={lowCount}
            subtitle="Operational awareness"
            icon={<CheckCircle size={18} />}
            tone="bg-emerald-50 text-emerald-700"
          />
        </section>

        <section className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2 md:w-96">
              <Search size={16} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityFilter)}
                className="bg-transparent text-sm font-medium outline-none"
              >
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-xl border bg-white p-8 text-gray-500">
            Loading notifications...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-gray-500">
            No notifications found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredItems.map((item, index) => {
              const style = severityClass(item.severity || "Low");

              return (
                <div
                  key={index}
                  className={`rounded-xl border p-5 shadow-sm ${style.card}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-3 ${style.icon}`}>
                      {typeIcon(item.type || "")}
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div>
                          <h2 className="font-bold text-gray-950">
                            {item.title || item.type}
                          </h2>

                          <p className="text-xs font-medium text-gray-500">
                            {item.type} · {style.label}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}
                        >
                          {item.severity}
                        </span>
                      </div>

                      <p className="text-sm leading-relaxed text-gray-700">
                        {item.message}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.severity?.toLowerCase() === "high" && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            Action Required
                          </span>
                        )}

                        {item.type?.toLowerCase().includes("inventory") && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            Check Inventory
                          </span>
                        )}

                        {item.type?.toLowerCase().includes("production") && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            Review Orders
                          </span>
                        )}

                        {item.type?.toLowerCase().includes("quality") && (
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                            Quality Review
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}