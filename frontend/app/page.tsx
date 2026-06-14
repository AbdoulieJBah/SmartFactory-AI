"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { api, getErrorMessage } from "./lib/api";
import {
  AlertTriangle,
  Boxes,
  Factory,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  TrendingUp,
  ClipboardCheck,
  Timer,
  Recycle,
  RefreshCw,
  Activity,
  Filter,
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
  CartesianGrid,
} from "recharts";

interface DashboardResponse {
  company?: { id: number; name: string };
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

type DateFilter = "Today" | "Week" | "Month" | "All";

type AnyRecord = Record<string, any>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPercent = (value: number) => `${Number(value || 0).toFixed(1)}%`;

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

function getStatusTone(status: string) {
  const s = status?.toLowerCase?.() || "";

  if (s.includes("complete") || s.includes("pass") || s.includes("running")) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (s.includes("progress") || s.includes("open") || s.includes("planned")) {
    return "bg-blue-100 text-blue-700";
  }

  if (s.includes("fail") || s.includes("down") || s.includes("late")) {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
}

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
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    red: "bg-red-50 text-red-700 border-red-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-1 text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`rounded-xl border p-2 ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [products, setProducts] = useState<AnyRecord[]>([]);
  const [inventory, setInventory] = useState<AnyRecord[]>([]);
  const [orders, setOrders] = useState<AnyRecord[]>([]);
  const [quality, setQuality] = useState<AnyRecord[]>([]);
  const [downtime, setDowntime] = useState<AnyRecord[]>([]);
  const [waste, setWaste] = useState<AnyRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("Week");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        dashboardRes,
        productsRes,
        inventoryRes,
        ordersRes,
        qualityRes,
        downtimeRes,
        wasteRes,
      ] = await Promise.allSettled([
        api.get<DashboardResponse>("/dashboard/"),
        api.get("/products/"),
        api.get("/inventory/"),
        api.get("/production-orders/"),
        api.get("/quality/"),
        api.get("/downtime/"),
        api.get("/waste/"),
      ]);

      if (dashboardRes.status === "fulfilled") {
        setData(dashboardRes.value.data);
      }

      if (productsRes.status === "fulfilled") {
        setProducts(safeArray(productsRes.value.data));
      }

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

      if (wasteRes.status === "fulfilled") {
        setWaste(safeArray(wasteRes.value.data));
      }

      if (dashboardRes.status === "rejected") {
        setError(getErrorMessage(dashboardRes.reason));
      }
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

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  const lowStockItems = useMemo(() => {
    return inventory
      .filter((item) => {
        const quantity = Number(getValue(item, ["quantity", "qty", "stock"], "0"));
        const minStock = Number(getValue(item, ["min_stock", "minStock", "minimum_stock"], "0"));
        return minStock > 0 && quantity <= minStock;
      })
      .slice(0, 6);
  }, [inventory]);

  const productionData = useMemo(
    () => [
      { name: "Target", value: 1500 },
      {
        name: "Produced",
        value: Math.max(
          0,
          Math.round(((kpis?.production_efficiency || 0) / 100) * 1500)
        ),
      },
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

  const trendData = useMemo(() => {
    if (orders.length > 0) {
      return orders.slice(0, 6).map((order, index) => ({
        day: `O${index + 1}`,
        output: Number(getValue(order, ["produced_quantity", "producedQuantity"], 0)),
        target: Number(getValue(order, ["target_quantity", "targetQuantity"], 0)),
      }));
    }

    return [
      { day: "Mon", output: 780, target: 900 },
      { day: "Tue", output: 920, target: 1000 },
      { day: "Wed", output: 850, target: 950 },
      { day: "Thu", output: 1100, target: 1200 },
      { day: "Fri", output: 980, target: 1100 },
      { day: "Sat", output: 1200, target: 1300 },
    ];
  }, [orders]);

  const activityFeed = useMemo(() => {
    const activities = [
      ...orders.slice(0, 3).map((order) => ({
        type: "Production",
        message: `Production order ${getValue(order, ["order_number", "orderNumber", "id"])} is ${getValue(order, ["status"], "updated")}.`,
        tone: "blue",
      })),
      ...quality.slice(0, 2).map((record) => ({
        type: "Quality",
        message: `Quality check ${getValue(record, ["result"], "recorded")} by ${getValue(record, ["inspector", "inspector_name"], "Quality Team")}.`,
        tone: "green",
      })),
      ...downtime.slice(0, 2).map((record) => ({
        type: "Downtime",
        message: `${getValue(record, ["duration_minutes", "duration"], 0)} minutes downtime recorded for ${getValue(record, ["reason"], "equipment issue")}.`,
        tone: "red",
      })),
      ...waste.slice(0, 2).map((record) => ({
        type: "Waste",
        message: `${getValue(record, ["quantity"], 0)} units wasted due to ${getValue(record, ["reason"], "production loss")}.`,
        tone: "orange",
      })),
    ];

    return activities.slice(0, 8);
  }, [orders, quality, downtime, waste]);

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="fixed left-0 top-0 z-40 h-screen w-72">
        <Sidebar />
      </div>

      <main className="ml-72 min-h-screen p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              {data?.company?.name || "SmartFactory AI"}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-950">
              Executive Dashboard
            </h1>
            <p className="mt-1 text-gray-500">
              Enterprise MES & ERP command center for production, quality, inventory, and finance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm">
              <Filter size={16} className="text-gray-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="bg-transparent text-sm font-medium outline-none"
              >
                <option>Today</option>
                <option>Week</option>
                <option>Month</option>
                <option>All</option>
              </select>
            </div>

            <button
              onClick={loadDashboard}
              className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-6 text-gray-500">
            Loading executive dashboard...
          </div>
        ) : !kpis ? (
          <div className="rounded-xl border bg-white p-6 text-gray-500">
            No dashboard data available.
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="Products" value={kpis.total_products} subtitle="Active product catalog" icon={<Package size={20} />} tone="blue" />
              <KpiCard title="Inventory Units" value={kpis.total_inventory_units} subtitle="Total warehouse stock" icon={<Boxes size={20} />} tone="green" />
              <KpiCard title="Inventory Value" value={formatCurrency(kpis.inventory_value)} subtitle="Estimated stock value" icon={<Wallet size={20} />} tone="purple" />
              <KpiCard title="Low Stock Items" value={kpis.low_stock_items} subtitle="Items below minimum stock" icon={<AlertTriangle size={20} />} tone={kpis.low_stock_items > 0 ? "red" : "green"} />

              <KpiCard title="Open Orders" value={kpis.open_production_orders} subtitle="Production orders not completed" icon={<Factory size={20} />} tone="orange" />
              <KpiCard title="Efficiency" value={formatPercent(kpis.production_efficiency)} subtitle="Produced vs target quantity" icon={<TrendingUp size={20} />} tone="green" />
              <KpiCard title="Quality Pass Rate" value={formatPercent(kpis.quality_pass_rate)} subtitle="Passed quality checks" icon={<ClipboardCheck size={20} />} tone="green" />
              <KpiCard title="Downtime" value={`${Number(kpis.downtime_hours || 0).toFixed(1)}h`} subtitle="Total recorded downtime" icon={<Timer size={20} />} tone={kpis.downtime_hours > 2 ? "red" : "blue"} />

              <KpiCard title="Waste Rate" value={formatPercent(kpis.waste_rate)} subtitle="Waste compared to output" icon={<Recycle size={20} />} tone={kpis.waste_rate > 5 ? "red" : "orange"} />
              <KpiCard title="Suppliers" value={kpis.total_suppliers} subtitle="Registered suppliers" icon={<Truck size={20} />} tone="blue" />
              <KpiCard title="Customers" value={kpis.total_customers} subtitle="Registered customers" icon={<Users size={20} />} tone="purple" />
              <KpiCard title="Sales Revenue" value={formatCurrency(kpis.total_sales_revenue)} subtitle="Total sales order value" icon={<ShoppingCart size={20} />} tone="green" />
            </section>

            <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
              <SectionCard title="Production Output" subtitle="Target, produced quantity, and waste.">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Quality Results" subtitle="Passed vs failed inspections.">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={qualityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                        <Cell fill="#16a34a" />
                        <Cell fill="#dc2626" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Financial Overview" subtitle="Sales, purchases, and inventory value.">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <SectionCard title="Weekly Production Trend" subtitle={`Filtered view: ${dateFilter}`}>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area dataKey="target" type="monotone" stroke="#94a3b8" fill="#e2e8f0" strokeWidth={2} />
                      <Area dataKey="output" type="monotone" stroke="#2563eb" fill="#bfdbfe" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Live Activity Feed" subtitle="Latest production, quality, downtime, and waste events.">
                <div className="space-y-3">
                  {activityFeed.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent activity found.</p>
                  ) : (
                    activityFeed.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-xl border p-3">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                          <Activity size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.type}</p>
                          <p className="text-sm text-gray-500">{item.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <SectionCard title="Recent Production Orders" subtitle="Latest manufacturing orders and execution status.">
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Target</th>
                        <th className="px-4 py-3">Produced</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-gray-500">
                            No production orders found.
                          </td>
                        </tr>
                      ) : (
                        recentOrders.map((order, index) => {
                          const status = String(getValue(order, ["status"], "Unknown"));
                          return (
                            <tr key={index} className="bg-white">
                              <td className="px-4 py-3 font-semibold">
                                {getValue(order, ["order_number", "orderNumber", "id"])}
                              </td>
                              <td className="px-4 py-3">
                                {getValue(order, ["product_name", "product", "product_id"], "Product")}
                              </td>
                              <td className="px-4 py-3">
                                {getValue(order, ["target_quantity", "targetQuantity"], 0)}
                              </td>
                              <td className="px-4 py-3">
                                {getValue(order, ["produced_quantity", "producedQuantity"], 0)}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(status)}`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard title="Low Stock Alerts" subtitle="Inventory items requiring replenishment attention.">
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Warehouse</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Min</th>
                        <th className="px-4 py-3">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lowStockItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-gray-500">
                            No low stock items found.
                          </td>
                        </tr>
                      ) : (
                        lowStockItems.map((item, index) => (
                          <tr key={index} className="bg-white">
                            <td className="px-4 py-3 font-semibold">
                              {getValue(item, ["product_name", "product", "product_id"], "Product")}
                            </td>
                            <td className="px-4 py-3">
                              {getValue(item, ["warehouse", "location"], "Main Warehouse")}
                            </td>
                            <td className="px-4 py-3">
                              {getValue(item, ["quantity", "qty", "stock"], 0)}
                            </td>
                            <td className="px-4 py-3">
                              {getValue(item, ["min_stock", "minStock", "minimum_stock"], 0)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                High
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </section>
          </>
        )}
      </main>
    </div>
  );
}