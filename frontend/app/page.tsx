"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { api, getErrorMessage } from "./lib/api";
import {
  AlertTriangle,
  Boxes,
  ClipboardCheck,
  Factory,
  Package,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardResponse {
  kpis: {
    total_products: number;
    total_suppliers: number;
    total_customers: number;
    total_inventory_units: number;
    inventory_value: number;
    open_production_orders: number;
    completed_production_orders: number;
    active_orders: number;
    production_efficiency: number;
    waste_rate: number;
    downtime_hours: number;
    quality_pass_rate: number;
    total_sales_revenue: number;
    total_purchase_value: number;
    low_stock_items: number;
  };
  charts: {
    production: { name: string; value: number }[];
    quality: { name: string; value: number }[];
    finance: { name: string; value: number }[];
  };
  insights: {
    title: string;
    message: string;
    severity: string;
  }[];
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>

        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
          <Icon size={22} />
        </div>
      </div>

      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setError("");
      const response = await api.get("/dashboard/");
      setData(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const kpis = data?.kpis;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 overflow-x-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Executive Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Real-time overview of manufacturing, inventory, quality, finance,
            and operational performance.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {!data ? (
          <div className="bg-white rounded-xl border p-8 text-gray-500">
            Loading executive dashboard...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <KpiCard
                title="Products"
                value={kpis?.total_products ?? 0}
                subtitle="Active product catalog"
                icon={Package}
              />

              <KpiCard
                title="Inventory Units"
                value={kpis?.total_inventory_units ?? 0}
                subtitle="Total warehouse stock"
                icon={Warehouse}
              />

              <KpiCard
                title="Inventory Value"
                value={`€${kpis?.inventory_value ?? 0}`}
                subtitle="Estimated stock value"
                icon={Wallet}
              />

              <KpiCard
                title="Low Stock Items"
                value={kpis?.low_stock_items ?? 0}
                subtitle="Items below minimum stock"
                icon={AlertTriangle}
              />

              <KpiCard
                title="Open Orders"
                value={kpis?.open_production_orders ?? 0}
                subtitle="Production orders not completed"
                icon={Factory}
              />

              <KpiCard
                title="Efficiency"
                value={`${kpis?.production_efficiency ?? 0}%`}
                subtitle="Produced vs target quantity"
                icon={TrendingUp}
              />

              <KpiCard
                title="Quality Pass Rate"
                value={`${kpis?.quality_pass_rate ?? 0}%`}
                subtitle="Passed quality checks"
                icon={ClipboardCheck}
              />

              <KpiCard
                title="Downtime"
                value={`${kpis?.downtime_hours ?? 0}h`}
                subtitle="Total recorded downtime"
                icon={Boxes}
              />

              <KpiCard
                title="Waste Rate"
                value={`${kpis?.waste_rate ?? 0}%`}
                subtitle="Waste compared to output"
                icon={AlertTriangle}
              />

              <KpiCard
                title="Suppliers"
                value={kpis?.total_suppliers ?? 0}
                subtitle="Registered suppliers"
                icon={Truck}
              />

              <KpiCard
                title="Customers"
                value={kpis?.total_customers ?? 0}
                subtitle="Registered customers"
                icon={Users}
              />

              <KpiCard
                title="Sales Revenue"
                value={`€${kpis?.total_sales_revenue ?? 0}`}
                subtitle="Total sales order value"
                icon={Wallet}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold mb-1">Production Output</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Target, produced quantity, and waste.
                </p>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.production}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold mb-1">Quality Results</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Passed vs failed inspections.
                </p>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.charts.quality}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        label
                      >
                        {data.charts.quality.map((_, index) => (
                          <Cell key={index} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold mb-1">Financial Overview</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Sales, purchases, and inventory value.
                </p>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.finance}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Executive Insights</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {data.insights.map((insight) => (
                  <div key={insight.title} className="border rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{insight.title}</h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          insight.severity === "High"
                            ? "bg-red-100 text-red-700"
                            : insight.severity === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {insight.severity}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}