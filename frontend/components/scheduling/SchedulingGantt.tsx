import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Clock,
  Factory,
  User,
} from "lucide-react";
import { ScheduleItem, AnyRecord } from "./types";
import {
  conflictClass,
  getValue,
  materialClass,
  priorityClass,
  statusClass,
} from "./helpers";

export default function SchedulingGantt({
  schedules,
  orders,
  workCenters,
}: {
  schedules: ScheduleItem[];
  orders: AnyRecord[];
  workCenters: AnyRecord[];
}) {
  const getOrderName = (id?: number | null) => {
    const order = orders.find(
      (o) => Number(getValue(o, ["id"], 0)) === Number(id)
    );

    return String(
      getValue(
        order || {},
        ["order_number", "orderNumber"],
        id ? `Order ${id}` : "-"
      )
    );
  };

  const getWorkCenterName = (id?: number | null) => {
    const wc = workCenters.find(
      (w) => Number(getValue(w, ["id"], 0)) === Number(id)
    );

    return String(getValue(wc || {}, ["name"], id ? `Work Center ${id}` : "Unassigned"));
  };

  const getHourPosition = (time: string) => {
    const hour = Number(time?.split(":")[0] || 0);
    return Math.max(0, Math.min(100, ((hour - 6) / 18) * 100));
  };

  const getDurationWidth = (start: string, end: string) => {
    const startHour = Number(start?.split(":")[0] || 0);
    const endHour = Number(end?.split(":")[0] || 0);
    const duration = Math.max(1, endHour - startHour);
    return Math.max(8, Math.min(100, (duration / 18) * 100));
  };

  const workCenterIds = Array.from(
    new Set(schedules.map((item) => item.work_center_id || 0))
  );

  return (
    <section className="mb-5 rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-950">
            Enterprise Gantt Scheduling Board
          </h2>
          <p className="text-sm text-gray-500">
            Machine-lane timeline with workflow, capacity, materials, conflicts, operators, and schedule type.
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 px-4 py-2 text-sm text-gray-600">
          Timeline: 06:00 - 24:00
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-xl border p-8 text-sm text-gray-500">
          No schedules found. Create manually or click Auto Optimize.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="mb-3 grid grid-cols-[220px_1fr] gap-3">
              <div />

              <div className="grid grid-cols-6 rounded-xl bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500">
                <span>06:00</span>
                <span>09:00</span>
                <span>12:00</span>
                <span>15:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>

            <div className="space-y-4">
              {workCenterIds.map((wcId) => {
                const laneSchedules = schedules.filter(
                  (item) => Number(item.work_center_id || 0) === Number(wcId)
                );

                const laneRisk = laneSchedules.some(
                  (item) =>
                    item.conflict_status === "Conflict" ||
                    item.material_status === "Insufficient" ||
                    Number(item.capacity_load || 0) >= 90
                );

                return (
                  <div
                    key={wcId}
                    className="grid grid-cols-[220px_1fr] gap-3 rounded-xl border bg-gray-50 p-4"
                  >
                    <div className="rounded-xl border bg-white p-4">
                      <div className="flex items-center gap-2 font-bold text-gray-950">
                        <Factory size={16} />
                        {getWorkCenterName(wcId)}
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {laneSchedules.length} scheduled jobs
                      </p>

                      <span
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          laneRisk
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {laneRisk ? "Risk Detected" : "Stable"}
                      </span>
                    </div>

                    <div className="relative min-h-[150px] rounded-xl border bg-white p-4">
                      <div className="absolute left-4 right-4 top-0 bottom-0 grid grid-cols-6">
                        {[1, 2, 3, 4, 5, 6].map((line) => (
                          <div
                            key={line}
                            className="border-l border-dashed border-gray-200"
                          />
                        ))}
                      </div>

                      <div className="relative h-full min-h-[120px]">
                        {laneSchedules.map((item, index) => {
                          const left = getHourPosition(item.start_time);
                          const width = getDurationWidth(
                            item.start_time,
                            item.end_time
                          );

                          const isConflict = item.conflict_status === "Conflict";
                          const materialProblem =
                            item.material_status === "Insufficient" ||
                            item.material_status === "No Inventory";

                          return (
                            <div
                              key={item.id}
                              className={`absolute rounded-xl border p-3 shadow-sm ${
                                isConflict || materialProblem
                                  ? "border-red-200 bg-red-50"
                                  : "border-blue-200 bg-blue-50"
                              }`}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                top: `${index * 88}px`,
                                minWidth: "210px",
                              }}
                            >
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-bold text-gray-950">
                                    {getOrderName(item.order_id)}
                                  </p>

                                  <p className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock size={12} />
                                    {item.start_time} - {item.end_time}
                                  </p>
                                </div>

                                {isConflict || materialProblem ? (
                                  <AlertTriangle
                                    size={16}
                                    className="text-red-600"
                                  />
                                ) : (
                                  <CheckCircle
                                    size={16}
                                    className="text-emerald-600"
                                  />
                                )}
                              </div>

                              <div className="mb-2 flex flex-wrap gap-1 text-[11px]">
                                <span
                                  className={`rounded-full px-2 py-1 font-semibold ${priorityClass(
                                    item.priority
                                  )}`}
                                >
                                  {item.priority}
                                </span>

                                <span
                                  className={`rounded-full px-2 py-1 font-semibold ${statusClass(
                                    item.status
                                  )}`}
                                >
                                  {item.status}
                                </span>

                                <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700">
                                  {item.schedule_type || "Manual"}
                                </span>
                              </div>

                              <div className="mb-2 h-2 rounded-full bg-white">
                                <div
                                  className={`h-2 rounded-full ${
                                    Number(item.capacity_load || 0) >= 90
                                      ? "bg-red-600"
                                      : Number(item.capacity_load || 0) >= 75
                                      ? "bg-orange-500"
                                      : "bg-blue-600"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Number(item.capacity_load || 0)
                                    )}%`,
                                  }}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-1 text-[11px]">
                                <span
                                  className={`rounded-full px-2 py-1 font-semibold ${materialClass(
                                    item.material_status || undefined
                                  )}`}
                                >
                                  Material: {item.material_status || "Unchecked"}
                                </span>

                                <span
                                  className={`rounded-full px-2 py-1 font-semibold ${conflictClass(
                                    item.conflict_status || undefined
                                  )}`}
                                >
                                  {item.conflict_status || "Clear"}
                                </span>
                              </div>

                              <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-600">
                                <User size={11} />
                                {item.assigned_operator || "Unassigned"}
                              </p>

                              <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                                <CalendarDays size={11} />
                                {item.schedule_date}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}