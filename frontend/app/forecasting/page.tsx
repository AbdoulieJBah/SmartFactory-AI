"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import {
  TrendingUp,
  Package,
  Factory,
  Warehouse,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import {
  Bar,
  BarChart,
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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

export default function ForecastingPage() {
  const [data, setData] = useState<ForecastingData | null>(null);
  const [error, setError] = useState("");

  const fetchForecasting = async () => {
    try {
      setError("");
      const res = await api.get("/forecasting/");
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchForecasting();
  }, []);

  const s = data?.summary;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 overflow-x-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <TrendingUp className="text-blue-600" />
            Forecasting
          </h1>

          <p className="text-gray-500 mt-2">
            Demand forecasting, inventory planning, and production risk insights.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {!data ? (
          <div className="bg-white rounded-xl border p-8 text-gray-500">
            Loading forecasting data...
          </div>
        ) : (
          <>
            <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold">{data.company.name}</h2>
              <p className="text-gray-500 mt-1">
                Forecasting overview for the selected company.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KpiCard
                title="Sales Demand"
                value={s?.total_sales_quantity ?? 0}
                subtitle="Total sales order quantity"
                icon={Package}
              />

              <KpiCard
                title="Production Target"
                value={s?.total_production_target ?? 0}
                subtitle="Planned production quantity"
                icon={Factory}
              />

              <KpiCard
                title="Current Inventory"
                value={s?.total_inventory ?? 0}
                subtitle="Available stock quantity"
                icon={Warehouse}
              />

              <KpiCard
                title="Forecast Demand"
                value={s?.demand_forecast ?? 0}
                subtitle="Estimated future demand"
                icon={TrendingUp}
              />

              <KpiCard
                title="Inventory Gap"
                value={s?.inventory_gap ?? 0}
                subtitle="Forecast demand minus stock"
                icon={AlertTriangle}
              />

              <KpiCard
                title="Risk Level"
                value={s?.risk_level ?? "Low"}
                subtitle={`${s?.low_stock_count ?? 0} low stock items`}
                icon={AlertTriangle}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold mb-1">Forecast Chart</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Sales demand, production target, inventory, and forecast.
                </p>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chart_data}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="text-yellow-500" />
                  Recommendations
                </h2>

                <div className="space-y-4">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-xl p-4 bg-gray-50">
                      <h3 className="font-semibold">{rec.title}</h3>
                      <p className="text-sm text-gray-600 mt-2">{rec.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}