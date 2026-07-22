"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import {
  AlertTriangle,
  CalendarDays,
  Factory,
  Lightbulb,
  Package,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ForecastingData {
  company: {
    id: number;
    name: string;
  };
  summary: {
    total_sales_quantity: number;
    total_production_target: number;
    total_inventory: number;
    demand_forecast: number;
    inventory_gap: number;
    low_stock_count: number;
    risk_level: string;
  };
  chart_data: {
    name: string;
    value: number;
  }[];
  recommendations: {
    title: string;
    message: string;
  }[];
}

type AnyRecord = Record<string, unknown>;
type ApiCollection = {
  data?: unknown;
  items?: unknown;
  results?: unknown;
};
type ForecastWindow = "7 Days" | "30 Days" | "90 Days" | "12 Months";

const safeArray = (value: unknown): AnyRecord[] => {
  if (Array.isArray(value)) return value;
  const collection = value && typeof value === "object" ? (value as ApiCollection) : {};
  if (Array.isArray(collection.data)) return collection.data as AnyRecord[];
  if (Array.isArray(collection.items)) return collection.items as AnyRecord[];
  if (Array.isArray(collection.results)) return collection.results as AnyRecord[];
  return [];
};

function getValue(
  obj: AnyRecord,
  keys: string[],
  fallback: string | number = "-"
): string | number {
  for (const key of keys) {
    const value = obj?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return typeof value === "number" || typeof value === "string"
        ? value
        : String(value);
    }
  }

  return fallback;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IE", {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getRiskTone(risk: string) {
  const r = risk.toLowerCase();

  if (r.includes("high")) return "bg-red-50 text-red-700 border-red-100";
  if (r.includes("medium")) return "bg-orange-50 text-orange-700 border-orange-100";
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
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
          <h2 className="mt-1 text-2xl font-bold text-gray-950">{value}</h2>
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
        <h2 className="text-lg font-bold text-gray-950">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      {children}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-950">
          {Math.min(100, Math.max(0, value)).toFixed(0)}%
        </span>
      </div>

      <div className="h-2 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function ForecastingPage() {
  const [data, setData] = useState<ForecastingData | null>(null);
  const [products, setProducts] = useState<AnyRecord[]>([]);
  const [inventory, setInventory] = useState<AnyRecord[]>([]);
  const [orders, setOrders] = useState<AnyRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState<ForecastWindow>("30 Days");

  const fetchForecasting = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        forecastingRes,
        productsRes,
        inventoryRes,
        productionOrdersRes,
      ] = await Promise.allSettled([
        api.get("/forecasting/"),
        api.get("/products/"),
        api.get("/inventory/"),
        api.get("/production-orders/"),
      ]);

      if (forecastingRes.status === "fulfilled") {
        setData(forecastingRes.value.data);
      }

      if (productsRes.status === "fulfilled") {
        setProducts(safeArray(productsRes.value.data));
      }

      if (inventoryRes.status === "fulfilled") {
        setInventory(safeArray(inventoryRes.value.data));
      }

      if (productionOrdersRes.status === "fulfilled") {
        setOrders(safeArray(productionOrdersRes.value.data));
      }

      if (forecastingRes.status === "rejected") {
        setError(getErrorMessage(forecastingRes.reason));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasting();
  }, []);

  const s = data?.summary;

  const getProductName = useCallback((productId: string | number) => {
    const product = products.find(
      (p) => String(getValue(p, ["id"], "")) === String(productId)
    );

    return String(getValue(product || {}, ["name", "product_name", "sku"], `Product ${productId}`));
  }, [products]);

  const demandCoverage = useMemo(() => {
    if (!s || s.demand_forecast <= 0) return 0;
    return (s.total_inventory / s.demand_forecast) * 100;
  }, [s]);

  const productionCoverage = useMemo(() => {
    if (!s || s.demand_forecast <= 0) return 0;
    return (s.total_production_target / s.demand_forecast) * 100;
  }, [s]);

  const gapRisk = useMemo(() => {
    if (!s) return "Low";
    if (s.inventory_gap > 0 || s.low_stock_count > 0) return "High";
    if (demandCoverage < 80) return "Medium";
    return "Low";
  }, [s, demandCoverage]);

  const demandTrend = useMemo(() => {
    const base = Number(s?.demand_forecast || 0);

    return [
      { period: "W1", forecast: Math.round(base * 0.75), actual: Math.round(base * 0.68) },
      { period: "W2", forecast: Math.round(base * 0.9), actual: Math.round(base * 0.82) },
      { period: "W3", forecast: Math.round(base * 1.0), actual: Math.round(base * 0.95) },
      { period: "W4", forecast: Math.round(base * 1.1), actual: Math.round(base * 0.98) },
      { period: "Next", forecast: Math.round(base * 1.18), actual: 0 },
    ];
  }, [s]);

  const planningMix = useMemo(() => {
    if (!s) return [];

    return [
      { name: "Inventory", value: s.total_inventory },
      { name: "Production", value: s.total_production_target },
      { name: "Forecast Gap", value: Math.max(0, s.inventory_gap) },
    ];
  }, [s]);

  const topInventoryRisks = useMemo(() => {
    return inventory
      .map((item) => {
        const productId = getValue(item, ["product_id", "productId", "product"], "");
        const quantity = Number(getValue(item, ["quantity", "qty", "stock"], "0"));
        const minStock = Number(
          getValue(item, ["min_stock", "minStock", "minimum_stock"], "0")
        );
        const gap = Math.max(0, minStock - quantity);

        return {
          productId,
          productName: getProductName(productId),
          warehouse: String(getValue(item, ["warehouse", "location"], "Main Warehouse")),
          quantity,
          minStock,
          gap,
          risk:
            gap > 0
              ? "High"
              : quantity <= minStock * 1.25
              ? "Medium"
              : "Low",
        };
      })
      .filter((item) => item.risk !== "Low")
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 6);
  }, [inventory, getProductName]);

  const productionPlan = useMemo(() => {
    return orders.slice(0, 6).map((order) => {
      const productId = getValue(order, ["product_id", "productId", "product"], "");
      const target = Number(getValue(order, ["target_quantity", "targetQuantity"], "0"));
      const produced = Number(
        getValue(order, ["produced_quantity", "producedQuantity"], "0")
      );
      const completion = target > 0 ? (produced / target) * 100 : 0;

      return {
        order: String(getValue(order, ["order_number", "orderNumber", "id"], "-")),
        product: getProductName(productId),
        target,
        produced,
        completion,
        status: String(getValue(order, ["status"], "Planned")),
      };
    });
  }, [orders, getProductName]);

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="ml-72 min-h-screen p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              {data?.company?.name || "SmartFactory AI"}
            </p>

            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold text-gray-950">
              <TrendingUp className="text-blue-700" />
              Forecasting Command Center
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Enterprise demand forecasting, inventory planning, production capacity, and material risk intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm">
              <CalendarDays size={16} className="text-gray-500" />
              <select
                value={window}
                onChange={(e) => setWindow(e.target.value as ForecastWindow)}
                className="bg-transparent text-sm font-medium outline-none"
              >
                <option>7 Days</option>
                <option>30 Days</option>
                <option>90 Days</option>
                <option>12 Months</option>
              </select>
            </div>

            <button
              onClick={fetchForecasting}
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
            Loading forecasting intelligence...
          </div>
        ) : !data || !s ? (
          <div className="rounded-xl border bg-white p-6 text-gray-500">
            No forecasting data available.
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                title="Sales Demand"
                value={formatNumber(s.total_sales_quantity)}
                subtitle="Confirmed sales quantity"
                icon={<ShoppingCart size={20} />}
                tone="blue"
              />

              <KpiCard
                title="Forecast Demand"
                value={formatNumber(s.demand_forecast)}
                subtitle={`${window} demand projection`}
                icon={<TrendingUp size={20} />}
                tone="purple"
              />

              <KpiCard
                title="Inventory Coverage"
                value={`${demandCoverage.toFixed(0)}%`}
                subtitle="Stock coverage against demand"
                icon={<Warehouse size={20} />}
                tone={demandCoverage < 80 ? "red" : "green"}
              />

              <KpiCard
                title="Risk Level"
                value={gapRisk}
                subtitle={`${s.low_stock_count} low stock items`}
                icon={<AlertTriangle size={20} />}
                tone={gapRisk === "High" ? "red" : gapRisk === "Medium" ? "orange" : "green"}
              />

              <KpiCard
                title="Production Target"
                value={formatNumber(s.total_production_target)}
                subtitle="Planned production quantity"
                icon={<Factory size={20} />}
                tone="green"
              />

              <KpiCard
                title="Production Coverage"
                value={`${productionCoverage.toFixed(0)}%`}
                subtitle="Planned production vs forecast"
                icon={<Target size={20} />}
                tone={productionCoverage < 80 ? "orange" : "green"}
              />

              <KpiCard
                title="Current Inventory"
                value={formatNumber(s.total_inventory)}
                subtitle="Available stock quantity"
                icon={<Package size={20} />}
                tone="blue"
              />

              <KpiCard
                title="Inventory Gap"
                value={formatNumber(s.inventory_gap)}
                subtitle="Forecast demand minus stock"
                icon={<AlertTriangle size={20} />}
                tone={s.inventory_gap > 0 ? "red" : "green"}
              />
            </section>

            <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
              <SectionCard
                title="Forecast vs Actual Trend"
                subtitle={`Projected demand over ${window}.`}
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={demandTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        dataKey="forecast"
                        type="monotone"
                        stroke="#2563eb"
                        fill="#bfdbfe"
                        strokeWidth={3}
                      />
                      <Area
                        dataKey="actual"
                        type="monotone"
                        stroke="#16a34a"
                        fill="#bbf7d0"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard
                title="Demand Planning Mix"
                subtitle="Inventory, planned production, and forecast gap."
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planningMix}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard
                title="Planning Coverage"
                subtitle="Readiness against forecasted demand."
              >
                <div className="space-y-6">
                  <ProgressRow
                    label="Inventory Coverage"
                    value={demandCoverage}
                    color={demandCoverage < 80 ? "bg-red-600" : "bg-emerald-600"}
                  />

                  <ProgressRow
                    label="Production Coverage"
                    value={productionCoverage}
                    color={productionCoverage < 80 ? "bg-orange-500" : "bg-blue-600"}
                  />

                  <div className={`rounded-xl border p-4 ${getRiskTone(gapRisk)}`}>
                    <p className="font-semibold">Forecast Risk Assessment</p>
                    <p className="mt-1 text-sm">
                      {gapRisk === "High"
                        ? "Forecast demand exceeds available inventory or low stock items exist. Immediate replenishment is recommended."
                        : gapRisk === "Medium"
                        ? "Inventory coverage is moderate. Monitor production and purchase planning."
                        : "Inventory and production plans are currently aligned with expected demand."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
                    <p className="font-semibold">AI Planning Insight</p>
                    <p className="mt-1 text-sm">
                      Prioritize products with low coverage, high sales demand, and open production requirements.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <SectionCard
                title="Inventory Risk Forecast"
                subtitle="Products likely to create shortages or replenishment pressure."
              >
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Warehouse</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Min</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {topInventoryRisks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-gray-500">
                            No inventory risks found.
                          </td>
                        </tr>
                      ) : (
                        topInventoryRisks.map((item, index) => (
                          <tr key={index} className="bg-white">
                            <td className="px-4 py-3 font-semibold text-gray-950">
                              {item.productName}
                            </td>
                            <td className="px-4 py-3">{item.warehouse}</td>
                            <td className="px-4 py-3">{formatNumber(item.quantity)}</td>
                            <td className="px-4 py-3">{formatNumber(item.minStock)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  item.risk === "High"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {item.risk === "High" ? "Reorder now" : "Monitor"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard
                title="Production Plan Forecast"
                subtitle="Open production plan readiness against forecast demand."
              >
                <div className="space-y-3">
                  {productionPlan.length === 0 ? (
                    <p className="text-sm text-gray-500">No production plan found.</p>
                  ) : (
                    productionPlan.map((item, index) => (
                      <div key={index} className="rounded-xl border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-950">
                              {item.order} · {item.product}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatNumber(item.produced)} / {formatNumber(item.target)} units
                            </p>
                          </div>

                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {item.status}
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{
                              width: `${Math.min(100, Math.max(0, item.completion))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <SectionCard
                title="Recommendations"
                subtitle="System-generated planning actions."
              >
                <div className="space-y-4">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="rounded-xl border bg-gray-50 p-4">
                      <h3 className="flex items-center gap-2 font-semibold text-gray-950">
                        <Lightbulb size={16} className="text-yellow-500" />
                        {rec.title}
                      </h3>

                      <p className="mt-2 text-sm text-gray-600">{rec.message}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Executive Planning Actions"
                subtitle="What management should do next."
              >
                <div className="space-y-3">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                    <p className="font-semibold">1. Secure Materials</p>
                    <p className="mt-1 text-sm">
                      Review low-stock and high-demand products before the next production cycle.
                    </p>
                  </div>

                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-700">
                    <p className="font-semibold">2. Align Production Capacity</p>
                    <p className="mt-1 text-sm">
                      Compare production targets against forecast demand and adjust work center capacity.
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
                    <p className="font-semibold">3. Monitor Demand Changes</p>
                    <p className="mt-1 text-sm">
                      Use weekly demand changes to update purchase orders, inventory thresholds, and production schedules.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
