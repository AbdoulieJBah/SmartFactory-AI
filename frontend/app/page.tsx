"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { api, getErrorMessage } from "./lib/api";
import {
  AlertTriangle,
  Boxes,
  Factory,
  Gauge,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  TrendingUp,
  ClipboardCheck,
  Timer,
  Recycle,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface DashboardResponse {
  company?: {
    id: number;
    name: string;
  };
  kpis: {
    total_products: number;
    total_suppliers: number;
    total_customers: number;
    total_inventory_units: number;
    inventory_value: number;
    low_stock_items: number;
    open_production_orders: number;
    completed_production_orders: number;
    production_efficiency: number;
    waste_rate: number;
    downtime_hours: number;
    quality_pass_rate: number;
    total_sales_revenue: number;
    total_purchase_value: number;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPercent = (value: number) => `${Number(value || 0).toFixed(1)}%`;

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  tone = "blue",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  tone?: "blue" | "green" | "orange" | "red" | "purple";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    red: "bg-red-50 text-red-700 border-red-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`rounded-xl border p-3 ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-4 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function InsightCard({
  title,
  value,
  level,
  description,
}: {
  title: string;
  value: string;
  level: "Low" | "Medium" | "High";
  description: string;
}) {
  const levelStyle =
    level === "High"
      ? "bg-red-100 text-red-700"
      : level === "Medium"
      ? "bg-orange-100 text-orange-700"
      : "bg-green-100 text-green-700";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelStyle}`}>
          {level}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<DashboardResponse>("/dashboard/");
      setData(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const kpis = data?.kpis;

  const productionData = useMemo(
    () => [
      { name: "Target", value: 1500 },
      { name: "Produced", value: Math.max(0, Math.round(((kpis?.production_efficiency || 0) / 100) * 1500)) },
      { name: "Waste", value: Math.round((kpis?.waste_rate || 0) * 10) },
    ],
    [kpis]
  );

  const qualityData = useMemo(
    () => [
      { name: "Passed", value: kpis?.quality_pass_rate || 0 },
      { name: "Failed", value: Math.max(0, 100 - (kpis?.quality_pass_rate || 0)) },
    ],
    [kpis]
  );

  const financialData = useMemo(
    () => [
      { name: "Sales", value: kpis?.total_sales_revenue || 0 },
      { name: "Purchases", value: kpis?.total_purchase_value || 0 },
      { name: "Inventory", value: kpis?.inventory_value || 0 },
    ],
    [kpis]
  );

  const trendData = [
    { day: "Mon", output: 780 },
    { day: "Tue", output: 920 },
    { day: "Wed", output: 850 },
    { day: "Thu", output: 1100 },
    { day: "Fri", output: 980 },
    { day: "Sat", output: 1200 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-72 p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              {data?.company?.name || "SmartFactory AI"}
            </p>
            <h1 className="mt-1 text-4xl font-bold text-gray-900">
              Executive Dashboard
            </h1>
            <p className="mt-2 text-gray-500">
              Real-time manufacturing, inventory, quality, finance, and operational intelligence.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border bg-white p-8 text-gray-500">
            Loading executive dashboard...
          </div>
        ) : !kpis ? (
          <div className="rounded-2xl border bg-white p-8 text-gray-500">
            No dashboard data available.
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                title="Products"
                value={kpis.total_products}
                subtitle="Active product catalog"
                icon={<Package size={22} />}
                tone="blue"
              />
              <KpiCard
                title="Inventory Units"
                value={kpis.total_inventory_units}
                subtitle="Total warehouse stock"
                icon={<Boxes size={22} />}
                tone="green"
              />
              <KpiCard
                title="Inventory Value"
                value={formatCurrency(kpis.inventory_value)}
                subtitle="Estimated stock value"
                icon={<Wallet size={22} />}
                tone="purple"
              />
              <KpiCard
                title="Low Stock Items"
                value={kpis.low_stock_items}
                subtitle="Items below minimum stock"
                icon={<AlertTriangle size={22} />}
                tone={kpis.low_stock_items > 0 ? "red" : "green"}
              />

              <KpiCard
                title="Open Orders"
                value={kpis.open_production_orders}
                subtitle="Production orders not completed"
                icon={<Factory size={22} />}
                tone="orange"
              />
              <KpiCard
                title="Efficiency"
                value={formatPercent(kpis.production_efficiency)}
                subtitle="Produced vs target quantity"
                icon={<TrendingUp size={22} />}
                tone="green"
              />
              <KpiCard
                title="Quality Pass Rate"
                value={formatPercent(kpis.quality_pass_rate)}
                subtitle="Passed quality checks"
                icon={<ClipboardCheck size={22} />}
                tone="green"
              />
              <KpiCard
                title="Downtime"
                value={`${Number(kpis.downtime_hours || 0).toFixed(1)}h`}
                subtitle="Total recorded downtime"
                icon={<Timer size={22} />}
                tone={kpis.downtime_hours > 2 ? "red" : "blue"}
              />

              <KpiCard
                title="Waste Rate"
                value={formatPercent(kpis.waste_rate)}
                subtitle="Waste compared to output"
                icon={<Recycle size={22} />}
                tone={kpis.waste_rate > 5 ? "red" : "orange"}
              />
              <KpiCard
                title="Suppliers"
                value={kpis.total_suppliers}
                subtitle="Registered suppliers"
                icon={<Truck size={22} />}
                tone="blue"
              />
              <KpiCard
                title="Customers"
                value={kpis.total_customers}
                subtitle="Registered customers"
                icon={<Users size={22} />}
                tone="purple"
              />
              <KpiCard
                title="Sales Revenue"
                value={formatCurrency(kpis.total_sales_revenue)}
                subtitle="Total sales order value"
                icon={<ShoppingCart size={22} />}
                tone="green"
              />
            </section>

            <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Production Output</h2>
                <p className="text-sm text-gray-500">Target, produced quantity, and waste.</p>
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productionData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Quality Results</h2>
                <p className="text-sm text-gray-500">Passed vs failed inspections.</p>
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={qualityData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        <Cell />
                        <Cell />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Financial Overview</h2>
                <p className="text-sm text-gray-500">Sales, purchases, and inventory value.</p>
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Weekly Production Trend</h2>
                <p className="text-sm text-gray-500">Demo trend for production performance.</p>
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area dataKey="output" type="monotone" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Operational Health</h2>
                <p className="text-sm text-gray-500">Executive risk summary.</p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-semibold text-gray-900">Inventory Risk</p>
                      <p className="text-sm text-gray-500">
                        {kpis.low_stock_items} items below or near minimum stock.
                      </p>
                    </div>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      {kpis.low_stock_items > 0 ? "High" : "Low"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-semibold text-gray-900">Production Performance</p>
                      <p className="text-sm text-gray-500">
                        Production efficiency is {formatPercent(kpis.production_efficiency)}.
                      </p>
                    </div>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                      Medium
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-semibold text-gray-900">Quality Performance</p>
                      <p className="text-sm text-gray-500">
                        Quality pass rate is {formatPercent(kpis.quality_pass_rate)}.
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Low
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-semibold text-gray-900">Downtime</p>
                      <p className="text-sm text-gray-500">
                        Total downtime is {Number(kpis.downtime_hours || 0).toFixed(1)} hours.
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Low
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-4">
              <InsightCard
                title="Inventory Risk"
                value={`${kpis.low_stock_items} Low Stock`}
                level={kpis.low_stock_items > 0 ? "High" : "Low"}
                description="Review replenishment before next production cycle."
              />
              <InsightCard
                title="Production"
                value={formatPercent(kpis.production_efficiency)}
                level="Medium"
                description="Monitor open orders and produced quantity."
              />
              <InsightCard
                title="Quality"
                value={formatPercent(kpis.quality_pass_rate)}
                level="Low"
                description="Current quality performance is stable."
              />
              <InsightCard
                title="Downtime"
                value={`${Number(kpis.downtime_hours || 0).toFixed(1)}h`}
                level={kpis.downtime_hours > 2 ? "High" : "Low"}
                description="Downtime remains within acceptable limits."
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}