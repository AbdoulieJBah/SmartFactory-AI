"use client";

import { useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Factory,
  Filter,
  Gauge,
  Layers,
  RefreshCw,
  Timer,
  Truck,
  Zap,
} from "lucide-react";

type Priority = "Urgent" | "High" | "Normal";
type Status = "Planned" | "Released" | "In Progress" | "Completed";
type ViewMode = "Week" | "Today" | "Month";

interface ScheduleOrder {
  order: string;
  product: string;
  line: string;
  status: Status;
  priority: Priority;
  start: string;
  end: string;
  target: number;
  produced: number;
  capacity: number;
}

const schedule: { day: string; orders: ScheduleOrder[] }[] = [
  {
    day: "Monday",
    orders: [
      {
        order: "PO-2026-001",
        product: "Fresh Salad Mix",
        line: "Packaging Line A",
        status: "In Progress",
        priority: "High",
        start: "08:00",
        end: "12:00",
        target: 1000,
        produced: 850,
        capacity: 88,
      },
      {
        order: "PO-2026-002",
        product: "Rocket Salad",
        line: "Washing Line A",
        status: "Planned",
        priority: "Normal",
        start: "13:00",
        end: "16:00",
        target: 700,
        produced: 0,
        capacity: 72,
      },
    ],
  },
  {
    day: "Tuesday",
    orders: [
      {
        order: "PO-2026-003",
        product: "Baby Spinach Pack",
        line: "Packaging Line B",
        status: "Released",
        priority: "Normal",
        start: "09:00",
        end: "13:00",
        target: 900,
        produced: 0,
        capacity: 76,
      },
    ],
  },
  {
    day: "Wednesday",
    orders: [
      {
        order: "PO-2026-004",
        product: "Organic Salad Bowl",
        line: "Packaging Line A",
        status: "Planned",
        priority: "Urgent",
        start: "07:00",
        end: "11:00",
        target: 1200,
        produced: 0,
        capacity: 94,
      },
    ],
  },
  {
    day: "Thursday",
    orders: [
      {
        order: "PO-2026-005",
        product: "Family Salad Pack",
        line: "Mixing Station",
        status: "Planned",
        priority: "High",
        start: "10:00",
        end: "15:00",
        target: 1500,
        produced: 0,
        capacity: 82,
      },
    ],
  },
];

function priorityClass(priority: Priority) {
  if (priority === "Urgent") return "bg-red-100 text-red-700";
  if (priority === "High") return "bg-orange-100 text-orange-700";
  return "bg-blue-100 text-blue-700";
}

function statusClass(status: Status) {
  if (status === "Completed") return "bg-emerald-100 text-emerald-700";
  if (status === "In Progress") return "bg-blue-100 text-blue-700";
  if (status === "Released") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
}

function KpiCard({
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

export default function SchedulingPage() {
  const [view, setView] = useState<ViewMode>("Week");

  const allOrders = useMemo(
    () => schedule.flatMap((day) => day.orders.map((order) => ({ ...order, day: day.day }))),
    []
  );

  const scheduledOrders = allOrders.length;
  const activeLines = new Set(allOrders.map((order) => order.line)).size;
  const avgCapacity = Math.round(
    allOrders.reduce((sum, order) => sum + order.capacity, 0) / allOrders.length
  );
  const urgentOrders = allOrders.filter((order) => order.priority === "Urgent").length;

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="fixed left-0 top-0 z-40 h-screen w-72">
        <Sidebar />
      </div>

      <main className="ml-72 min-h-screen p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              SmartFactory AI
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold text-gray-950">
              <CalendarDays className="text-blue-700" />
              Production Scheduling Board
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Plan production orders, allocate work centers, monitor capacity, and reduce changeover risk.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm">
              <Filter size={16} className="text-gray-500" />
              <select
                value={view}
                onChange={(e) => setView(e.target.value as ViewMode)}
                className="bg-transparent text-sm font-medium outline-none"
              >
                <option>Today</option>
                <option>Week</option>
                <option>Month</option>
              </select>
            </div>

            <button className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <KpiCard
            title="Scheduled Orders"
            value={scheduledOrders}
            subtitle={`${view} production plan`}
            icon={<CalendarDays size={18} />}
            tone="bg-blue-50 text-blue-700"
          />

          <KpiCard
            title="Active Lines"
            value={activeLines}
            subtitle="Work centers allocated"
            icon={<Factory size={18} />}
            tone="bg-emerald-50 text-emerald-700"
          />

          <KpiCard
            title="Capacity Utilization"
            value={`${avgCapacity}%`}
            subtitle="Average planned load"
            icon={<Gauge size={18} />}
            tone="bg-purple-50 text-purple-700"
          />

          <KpiCard
            title="Urgent Orders"
            value={urgentOrders}
            subtitle="Need priority sequencing"
            icon={<AlertTriangle size={18} />}
            tone="bg-red-50 text-red-700"
          />
        </section>

        <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <SectionCard
            title="Capacity Planning"
            subtitle="Line utilization and overload risk."
          >
            <div className="space-y-4">
              {["Packaging Line A", "Packaging Line B", "Washing Line A", "Mixing Station"].map(
                (line) => {
                  const load =
                    line === "Packaging Line A"
                      ? 94
                      : line === "Packaging Line B"
                      ? 76
                      : line === "Washing Line A"
                      ? 72
                      : 82;

                  return (
                    <div key={line}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{line}</span>
                        <span className="font-semibold text-gray-950">{load}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${
                            load >= 90
                              ? "bg-red-600"
                              : load >= 80
                              ? "bg-orange-500"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${load}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Shift Allocation"
            subtitle="Morning, afternoon, and night planning."
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl border p-4">
                <p className="font-semibold text-gray-950">Morning Shift</p>
                <p className="text-sm text-gray-500">08:00 - 14:00 · 3 orders</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="font-semibold text-gray-950">Afternoon Shift</p>
                <p className="text-sm text-gray-500">14:00 - 22:00 · 2 orders</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="font-semibold text-gray-950">Night Shift</p>
                <p className="text-sm text-gray-500">22:00 - 06:00 · Cleaning / Maintenance</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Scheduling Intelligence"
            subtitle="AI-style operational recommendations."
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="flex items-center gap-2 font-semibold text-red-700">
                  <Zap size={16} />
                  Capacity Risk
                </p>
                <p className="mt-1 text-sm text-red-600">
                  Packaging Line A is above 90% utilization. Move one normal-priority order to Line B.
                </p>
              </div>

              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="flex items-center gap-2 font-semibold text-orange-700">
                  <AlertTriangle size={16} />
                  Priority Alert
                </p>
                <p className="mt-1 text-sm text-orange-600">
                  PO-2026-004 is urgent and should be sequenced before normal-priority orders.
                </p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="flex items-center gap-2 font-semibold text-blue-700">
                  <Layers size={16} />
                  Changeover Optimization
                </p>
                <p className="mt-1 text-sm text-blue-600">
                  Group salad products together to reduce washing and packaging changeover time.
                </p>
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          {schedule.map((day) => (
            <div
              key={day.day}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-950">{day.day}</h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {day.orders.length} orders
                </span>
              </div>

              <div className="space-y-4">
                {day.orders.map((item) => {
                  const progress =
                    item.target > 0 ? Math.min(100, (item.produced / item.target) * 100) : 0;

                  return (
                    <div
                      key={item.order}
                      className="rounded-xl border p-4 transition hover:bg-gray-50"
                    >
                      <div className="mb-2 flex justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-950">
                            {item.order}
                          </p>
                          <p className="text-sm text-gray-500">{item.product}</p>
                        </div>

                        <span
                          className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <p className="flex items-center gap-1">
                          <Factory size={13} />
                          {item.line}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock size={13} />
                          {item.start} - {item.end}
                        </p>
                      </div>

                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>

                        <span className="text-xs font-semibold text-gray-600">
                          {progress.toFixed(0)}%
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-950">
            <Truck className="text-blue-700" />
            Dispatch Readiness
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <p className="font-semibold text-gray-950">Material Availability</p>
              <p className="mt-1 text-sm text-gray-500">
                Check inventory before releasing high-priority orders.
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="font-semibold text-gray-950">Labor Planning</p>
              <p className="mt-1 text-sm text-gray-500">
                Morning shift requires full packaging team coverage.
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="font-semibold text-gray-950">Cold Chain Readiness</p>
              <p className="mt-1 text-sm text-gray-500">
                Finished salad batches should move to cold storage immediately.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}