"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Factory,
  Gauge,
  RefreshCw,
  Timer,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OEEData {
  company: {
    id: number;
    name: string;
  };
  planned_minutes: number;
  runtime_minutes: number;
  downtime_minutes: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  total_target: number;
  total_produced: number;
  total_quality_checks: number;
  failed_quality_checks: number;
  loss_reasons: {
    area: string;
    issue: string;
    recommendation: string;
  }[];
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getScoreTone(score: number) {
  if (score >= 85) return "text-emerald-700 bg-emerald-50 border-emerald-100";
  if (score >= 65) return "text-orange-700 bg-orange-50 border-orange-100";
  return "text-red-700 bg-red-50 border-red-100";
}

function getScoreLabel(score: number) {
  if (score >= 85) return "World Class";
  if (score >= 65) return "Needs Attention";
  return "Critical";
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  score,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  score: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="mt-1 text-3xl font-bold text-gray-950">{value}</h2>
        </div>

        <div className={`rounded-xl border p-2 ${getScoreTone(score)}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">{subtitle}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getScoreTone(score)}`}>
          {getScoreLabel(score)}
        </span>
      </div>
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
        <span className="font-semibold text-gray-950">{formatPercent(value)}</span>
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

export default function OEEPage() {
  const [oeeData, setOeeData] = useState<OEEData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOEE = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/oee/");
      setOeeData(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOEE();
  }, []);

  const chartData = useMemo(() => {
    if (!oeeData) return [];

    return [
      { name: "Availability", value: oeeData.availability },
      { name: "Performance", value: oeeData.performance },
      { name: "Quality", value: oeeData.quality },
      { name: "OEE", value: oeeData.oee },
    ];
  }, [oeeData]);

  const trendData = useMemo(() => {
    if (!oeeData) return [];

    return [
      { shift: "Shift 1", availability: 88, performance: 82, quality: 96, oee: 69 },
      { shift: "Shift 2", availability: 91, performance: 86, quality: 97, oee: 76 },
      {
        shift: "Current",
        availability: oeeData.availability,
        performance: oeeData.performance,
        quality: oeeData.quality,
        oee: oeeData.oee,
      },
    ];
  }, [oeeData]);

  const productionGap = useMemo(() => {
    if (!oeeData) return 0;
    return Math.max(0, oeeData.total_target - oeeData.total_produced);
  }, [oeeData]);

  const productionCompletion = useMemo(() => {
    if (!oeeData || oeeData.total_target <= 0) return 0;
    return (oeeData.total_produced / oeeData.total_target) * 100;
  }, [oeeData]);

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="fixed left-0 top-0 z-40 h-screen w-72">
        <Sidebar />
      </div>

      <main className="ml-72 min-h-screen p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              {oeeData?.company?.name || "SmartFactory AI"}
            </p>

            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold text-gray-950">
              <Gauge className="text-blue-700" />
              OEE Command Center
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Enterprise Overall Equipment Effectiveness monitoring for availability,
              performance, quality, downtime, and production losses.
            </p>
          </div>

          <button
            onClick={fetchOEE}
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

        {loading ? (
          <div className="rounded-xl border bg-white p-6 text-gray-500">
            Loading OEE metrics...
          </div>
        ) : !oeeData ? (
          <div className="rounded-xl border bg-white p-6 text-gray-500">
            No OEE data available.
          </div>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="OEE Score"
                value={formatPercent(oeeData.oee)}
                subtitle="Availability × performance × quality"
                icon={<Gauge size={22} />}
                score={oeeData.oee}
              />

              <MetricCard
                title="Availability"
                value={formatPercent(oeeData.availability)}
                subtitle="Runtime compared to planned time"
                icon={<Clock size={22} />}
                score={oeeData.availability}
              />

              <MetricCard
                title="Performance"
                value={formatPercent(oeeData.performance)}
                subtitle="Produced quantity vs target"
                icon={<TrendingUp size={22} />}
                score={oeeData.performance}
              />

              <MetricCard
                title="Quality"
                value={formatPercent(oeeData.quality)}
                subtitle="Good output vs failed checks"
                icon={<CheckCircle size={22} />}
                score={oeeData.quality}
              />
            </section>

            <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
              <SectionCard
                title="OEE Breakdown"
                subtitle="Core effectiveness components."
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard
                title="OEE Trend"
                subtitle="Shift-level effectiveness trend."
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="shift" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area
                        dataKey="oee"
                        type="monotone"
                        stroke="#2563eb"
                        fill="#bfdbfe"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard
                title="Quality Split"
                subtitle="Passed vs failed quality checks."
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Passed",
                            value:
                              oeeData.total_quality_checks -
                              oeeData.failed_quality_checks,
                          },
                          {
                            name: "Failed",
                            value: oeeData.failed_quality_checks,
                          },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label
                      >
                        <Cell fill="#16a34a" />
                        <Cell fill="#dc2626" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
              <SectionCard
                title="Production Execution"
                subtitle="Target, produced quantity, and execution gap."
              >
                <div className="space-y-5">
                  <ProgressRow
                    label="Production Completion"
                    value={productionCompletion}
                    color="bg-blue-600"
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Target</p>
                      <p className="text-2xl font-bold text-gray-950">
                        {oeeData.total_target}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Produced</p>
                      <p className="text-2xl font-bold text-gray-950">
                        {oeeData.total_produced}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Gap</p>
                      <p className="text-2xl font-bold text-red-600">
                        {productionGap}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <p className="font-semibold text-orange-800">
                      Production Action
                    </p>
                    <p className="mt-1 text-sm text-orange-700">
                      {productionGap > 0
                        ? `Production is ${productionGap} units below target. Review line capacity and open orders.`
                        : "Production target has been achieved."}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Time Utilization"
                subtitle="Planned time, runtime, and downtime impact."
              >
                <div className="space-y-5">
                  <ProgressRow
                    label="Runtime Utilization"
                    value={
                      oeeData.planned_minutes > 0
                        ? (oeeData.runtime_minutes / oeeData.planned_minutes) *
                          100
                        : 0
                    }
                    color="bg-emerald-600"
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Planned</p>
                      <p className="text-2xl font-bold text-gray-950">
                        {oeeData.planned_minutes}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Runtime</p>
                      <p className="text-2xl font-bold text-gray-950">
                        {oeeData.runtime_minutes}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Downtime</p>
                      <p className="text-2xl font-bold text-red-600">
                        {oeeData.downtime_minutes}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="font-semibold text-red-800">
                      Downtime Action
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      {oeeData.downtime_minutes > 0
                        ? `${oeeData.downtime_minutes} minutes of downtime recorded. Investigate machine stoppages and maintenance needs.`
                        : "No downtime recorded during this period."}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <SectionCard
                title="OEE Loss Analysis"
                subtitle="Loss reasons and improvement recommendations."
              >
                <div className="space-y-3">
                  {oeeData.loss_reasons.map((loss, index) => (
                    <div
                      key={index}
                      className="rounded-xl border bg-gray-50 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-950">
                          <AlertTriangle
                            size={16}
                            className="text-orange-500"
                          />
                          {loss.area}
                        </h3>

                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                          Action Required
                        </span>
                      </div>

                      <p className="text-sm text-red-600">{loss.issue}</p>

                      <p className="mt-2 text-sm text-emerald-700">
                        Recommendation: {loss.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Work Center View"
                subtitle="Demo production-line effectiveness summary."
              >
                <div className="space-y-3">
                  <div className="rounded-xl border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-2 font-semibold text-gray-950">
                        <Factory size={16} />
                        Washing Line A
                      </p>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Running
                      </span>
                    </div>
                    <ProgressRow
                      label="Line OEE"
                      value={Math.max(0, oeeData.oee - 3)}
                      color="bg-blue-600"
                    />
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-2 font-semibold text-gray-950">
                        <Wrench size={16} />
                        Packaging Line A
                      </p>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        Needs Attention
                      </span>
                    </div>
                    <ProgressRow
                      label="Line OEE"
                      value={Math.max(0, oeeData.oee - 12)}
                      color="bg-orange-500"
                    />
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-2 font-semibold text-gray-950">
                        <Timer size={16} />
                        Cold Storage A
                      </p>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Stable
                      </span>
                    </div>
                    <ProgressRow
                      label="Line OEE"
                      value={Math.min(100, oeeData.oee + 5)}
                      color="bg-emerald-600"
                    />
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