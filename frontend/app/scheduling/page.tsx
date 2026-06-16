"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";

import SchedulingKPIs from "../../components/scheduling/SchedulingKPIs";
import SchedulingActions from "../../components/scheduling/SchedulingActions";
import SchedulingForm from "../../components/scheduling/SchedulingForm";
import CapacityPlanning from "../../components/scheduling/CapacityPlanning";
import SchedulingGantt from "../../components/scheduling/SchedulingGantt";
import ScheduleCard from "../../components/scheduling/ScheduleCard";

import {
  AnyRecord,
  CapacityItem,
  emptyScheduleForm,
  ScheduleItem,
} from "../../components/scheduling/types";

import { safeArray } from "../../components/scheduling/helpers";

export default function SchedulingPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [orders, setOrders] = useState<AnyRecord[]>([]);
  const [workCenters, setWorkCenters] = useState<AnyRecord[]>([]);
  const [capacity, setCapacity] = useState<CapacityItem[]>([]);
  const [form, setForm] = useState(emptyScheduleForm);
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
        assigned_operator: form.assigned_operator || null,
        notes: form.notes || null,
      });

      setForm(emptyScheduleForm);
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

  async function deleteSchedule(id: number) {
    try {
      setError("");
      setSuccess("");

      await api.delete(`/scheduling/${id}`);
      setSuccess("Schedule deleted successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateWorkflow(id: number, status: string) {
    try {
      setError("");
      setSuccess("");

      await api.post(`/scheduling/${id}/workflow`, { status });
      setSuccess("Schedule workflow updated.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function exportCSV() {
    window.open(`${api.defaults.baseURL}/scheduling/export`, "_blank");
  }

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

            <h1 className="mt-1 text-3xl font-bold text-gray-950">
              Production Scheduling Board
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Enterprise scheduling with Gantt planning, auto optimization, reallocation, capacity, conflicts, materials, and operators.
            </p>
          </div>
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

        <SchedulingKPIs
          scheduledOrders={schedules.length}
          workCenters={workCenters.length}
          avgCapacity={avgCapacity}
          urgentOrders={urgentOrders}
          highRiskCenters={highRiskCenters}
        />

        <SchedulingActions
          actionLoading={actionLoading}
          onAutoGenerate={autoGenerateSchedule}
          onReallocate={reallocateMachines}
          onRefresh={loadData}
          onExport={exportCSV}
        />

        <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <SchedulingForm
            form={form}
            setForm={setForm}
            orders={orders}
            workCenters={workCenters}
            onSubmit={createSchedule}
          />

          <CapacityPlanning capacity={capacity} />
        </section>

        <SchedulingGantt
          schedules={schedules}
          orders={orders}
          workCenters={workCenters}
        />

        {loading ? (
          <div className="rounded-xl border bg-white p-8 text-gray-500">
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-gray-500">
            No schedules found. Create manually or click Auto Optimize.
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {Object.entries(groupedByDate).map(([date, items]) => (
              <div key={date} className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-bold">{date}</h2>

                <div className="space-y-4">
                  {items.map((item) => (
                    <ScheduleCard
                      key={item.id}
                      item={item}
                      orders={orders}
                      workCenters={workCenters}
                      onDelete={deleteSchedule}
                      onStatusChange={updateWorkflow}
                    />
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