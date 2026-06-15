"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  Clock,
  Factory,
  Gauge,
  RefreshCw,
  Shuffle,
  Zap,
} from "lucide-react";

type AnyRecord = Record<string, any>;

interface ScheduleItem {
  id: number;
  order_id?: number | null;
  work_center_id?: number | null;
  schedule_date: string;
  shift: string;
  start_time: string;
  end_time: string;
  priority: string;
  status: string;
  capacity_load: number;
  notes?: string | null;
}

interface CapacityItem {
  work_center_id: number;
  work_center_name: string;
  status: string;
  scheduled_orders: number;
  average_capacity_load: number;
  risk: string;
}

const emptyForm = {
  order_id: "",
  work_center_id: "",
  schedule_date: "",
  shift: "Morning",
  start_time: "08:00",
  end_time: "12:00",
  priority: "Normal",
  status: "Planned",
  capacity_load: 75,
  notes: "",
};

function safeArray(value: any): AnyRecord[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

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

function priorityClass(priority: string) {
  if (priority === "Urgent") return "bg-red-100 text-red-700";
  if (priority === "High") return "bg-orange-100 text-orange-700";
  return "bg-blue-100 text-blue-700";
}

function statusClass(status: string) {
  if (status === "Completed") return "bg-emerald-100 text-emerald-700";
  if (status === "In Progress") return "bg-blue-100 text-blue-700";
  if (status === "Released") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
}

function riskClass(risk: string) {
  if (risk === "High") return "bg-red-100 text-red-700";
  if (risk === "Medium") return "bg-orange-100 text-orange-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function SchedulingPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [orders, setOrders] = useState<AnyRecord[]>([]);
  const [workCenters, setWorkCenters] = useState<AnyRecord[]>([]);
  const [capacity, setCapacity] = useState<CapacityItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [scheduleRes, ordersRes, workCentersRes, capacityRes] =
        await Promise.allSettled([
          api.get("/scheduling/"),
          api.get("/production-orders/"),
          api.get("/work-centers/"),
          api.get("/scheduling/capacity"),
        ]);

      if (scheduleRes.status === "fulfilled") {
        setSchedules(safeArray(scheduleRes.value.data) as ScheduleItem[]);
      }

      if (ordersRes.status === "fulfilled") {
        setOrders(safeArray(ordersRes.value.data));
      }

      if (workCentersRes.status === "fulfilled") {
        setWorkCenters(safeArray(workCentersRes.value.data));
      }

      if (capacityRes.status === "fulfilled") {
        setCapacity(safeArray(capacityRes.value.data) as CapacityItem[]);
      }

      if (scheduleRes.status === "rejected") {
        setError(getErrorMessage(scheduleRes.reason));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createSchedule() {
    try {
      setError("");
      setSuccess("");

      await api.post("/scheduling/", {
        order_id: form.order_id ? Number(form.order_id) : null,
        work_center_id: form.work_center_id ? Number(form.work_center_id) : null,
        schedule_date: form.schedule_date,
        shift: form.shift,
        start_time: form.start_time,
        end_time: form.end_time,
        priority: form.priority,
        status: form.status,
        capacity_load: Number(form.capacity_load),
        notes: form.notes || null,
      });

      setForm(emptyForm);
      setSuccess("Manual schedule created successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function autoGenerateSchedule() {
    try {
      setActionLoading("auto");
      setError("");
      setSuccess("");

      const res = await api.post("/scheduling/auto-generate");

      setSuccess(res.data.message || "Optimized schedule generated.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  async function reallocateMachines() {
    try {
      setActionLoading("reallocate");
      setError("");
      setSuccess("");

      const res = await api.post("/scheduling/reallocate");

      setSuccess(
        `${res.data.message || "Machine reallocation completed."} Reallocated orders: ${
          res.data.reallocated_orders ?? 0
        }`
      );

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading("");
    }
  }

  const getOrderName = (id?: number | null) => {
    const order = orders.find(
      (o) => Number(getValue(o, ["id"], 0)) === Number(id)
    );

    return String(
      getValue(order || {}, ["order_number", "orderNumber"], id ? `Order ${id}` : "-")
    );
  };

  const getWorkCenterName = (id?: number | null) => {
    const wc = workCenters.find(
      (w) => Number(getValue(w, ["id"], 0)) === Number(id)
    );

    return String(getValue(wc || {}, ["name"], id ? `Work Center ${id}` : "-"));
  };

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ScheduleItem[]> = {};

    schedules.forEach((item) => {
      const date = item.schedule_date || "Unscheduled";
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });

    return groups;
  }, [schedules]);

  const avgCapacity =
    schedules.length > 0
      ? Math.round(
          schedules.reduce((sum, item) => sum + Number(item.capacity_load || 0), 0) /
            schedules.length
        )
      : 0;

  const urgentOrders = schedules.filter((item) => item.priority === "Urgent").length;

  const highRiskCenters = capacity.filter((item) => item.risk === "High").length;

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="fixed left-0 top-0 z-40 h-screen w-72">
        <Sidebar />
      </div>

      <main className="ml-72 min-h-screen p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">SmartFactory AI</p>

            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold text-gray-950">
              <CalendarDays className="text-blue-700" />
              Production Scheduling Board
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manual scheduling, auto optimization, machine reallocation, and capacity planning.
            </p>
          </div>

          <button
            onClick={loadData}
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

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {success}
          </div>
        )}

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <CalendarDays className="text-blue-700" />
            <p className="mt-3 text-sm text-gray-500">Scheduled Orders</p>
            <h2 className="text-2xl font-bold">{schedules.length}</h2>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <Factory className="text-emerald-700" />
            <p className="mt-3 text-sm text-gray-500">Work Centers</p>
            <h2 className="text-2xl font-bold">{workCenters.length}</h2>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <Gauge className="text-purple-700" />
            <p className="mt-3 text-sm text-gray-500">Avg Capacity</p>
            <h2 className="text-2xl font-bold">{avgCapacity}%</h2>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <AlertTriangle className="text-red-700" />
            <p className="mt-3 text-sm text-gray-500">Urgent Orders</p>
            <h2 className="text-2xl font-bold">{urgentOrders}</h2>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <Zap className="text-orange-700" />
            <p className="mt-3 text-sm text-gray-500">High Risk Centers</p>
            <h2 className="text-2xl font-bold">{highRiskCenters}</h2>
          </div>
        </section>

        <section className="mb-5 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Enterprise Scheduling Actions</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button
              onClick={autoGenerateSchedule}
              disabled={!!actionLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              <Bot size={18} />
              {actionLoading === "auto" ? "Optimizing..." : "Auto Optimize Schedule"}
            </button>

            <button
              onClick={reallocateMachines}
              disabled={!!actionLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
            >
              <Shuffle size={18} />
              {actionLoading === "reallocate"
                ? "Reallocating..."
                : "Reallocate Machines"}
            </button>

            <button
              onClick={loadData}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 font-semibold text-white hover:bg-gray-800"
            >
              <Gauge size={18} />
              Refresh Capacity View
            </button>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Create Manual Schedule</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <select
                value={form.order_id}
                onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                className="rounded-lg border px-3 py-2"
              >
                <option value="">Select Order</option>
                {orders.map((order) => (
                  <option key={String(order.id)} value={String(order.id)}>
                    {getValue(order, ["order_number", "orderNumber", "id"])}
                  </option>
                ))}
              </select>

              <select
                value={form.work_center_id}
                onChange={(e) =>
                  setForm({ ...form, work_center_id: e.target.value })
                }
                className="rounded-lg border px-3 py-2"
              >
                <option value="">Select Work Center</option>
                {workCenters.map((wc) => (
                  <option key={String(wc.id)} value={String(wc.id)}>
                    {getValue(wc, ["name", "id"])}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={form.schedule_date}
                onChange={(e) =>
                  setForm({ ...form, schedule_date: e.target.value })
                }
                className="rounded-lg border px-3 py-2"
              />

              <select
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                className="rounded-lg border px-3 py-2"
              >
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Night</option>
              </select>

              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="rounded-lg border px-3 py-2"
              />

              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="rounded-lg border px-3 py-2"
              />

              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="rounded-lg border px-3 py-2"
              >
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>

              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="rounded-lg border px-3 py-2"
              >
                <option>Planned</option>
                <option>Released</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>

              <input
                type="number"
                value={form.capacity_load}
                onChange={(e) =>
                  setForm({ ...form, capacity_load: Number(e.target.value) })
                }
                placeholder="Capacity %"
                className="rounded-lg border px-3 py-2"
              />

              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes"
                className="rounded-lg border px-3 py-2"
              />

              <button
                onClick={createSchedule}
                disabled={!form.schedule_date}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300 md:col-span-2"
              >
                Create Manual Schedule
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Capacity Planning</h2>

            {capacity.length === 0 ? (
              <p className="text-sm text-gray-500">No capacity data found.</p>
            ) : (
              <div className="space-y-4">
                {capacity.map((item) => (
                  <div key={item.work_center_id} className="rounded-xl border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{item.work_center_name}</p>
                        <p className="text-sm text-gray-500">
                          {item.status} · {item.scheduled_orders} scheduled orders
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${riskClass(
                          item.risk
                        )}`}
                      >
                        {item.risk}
                      </span>
                    </div>

                    <div className="mb-1 flex justify-between text-sm">
                      <span>Average Capacity Load</span>
                      <strong>{item.average_capacity_load}%</strong>
                    </div>

                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${
                          item.average_capacity_load >= 90
                            ? "bg-red-600"
                            : item.average_capacity_load >= 75
                            ? "bg-orange-500"
                            : "bg-blue-600"
                        }`}
                        style={{
                          width: `${Math.min(100, item.average_capacity_load)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {loading ? (
          <div className="rounded-xl border bg-white p-8 text-gray-500">
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-gray-500">
            No schedules found. Create manually or click Auto Optimize Schedule.
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {Object.entries(groupedByDate).map(([date, items]) => (
              <div key={date} className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-bold">{date}</h2>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <div className="mb-2 flex justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {getOrderName(item.order_id)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getWorkCenterName(item.work_center_id)}
                          </p>
                        </div>

                        <span
                          className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <p className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={14} />
                        {item.shift}: {item.start_time} - {item.end_time}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>

                        <span className="text-sm font-semibold">
                          {Number(item.capacity_load || 0)}%
                        </span>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{
                            width: `${Math.min(
                              100,
                              Number(item.capacity_load || 0)
                            )}%`,
                          }}
                        />
                      </div>

                      {item.notes && (
                        <p className="mt-3 text-sm text-gray-500">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}