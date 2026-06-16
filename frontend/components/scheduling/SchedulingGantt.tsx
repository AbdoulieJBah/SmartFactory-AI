import { Clock, Factory } from "lucide-react";
import { ScheduleItem, AnyRecord } from "./types";
import { conflictClass, getValue, materialClass } from "./helpers";

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
    const order = orders.find((o) => Number(getValue(o, ["id"], 0)) === Number(id));
    return String(getValue(order || {}, ["order_number", "orderNumber"], id ? `Order ${id}` : "-"));
  };

  const getWorkCenterName = (id?: number | null) => {
    const wc = workCenters.find((w) => Number(getValue(w, ["id"], 0)) === Number(id));
    return String(getValue(wc || {}, ["name"], id ? `Work Center ${id}` : "Unassigned"));
  };

  const workCenterIds = Array.from(
    new Set(schedules.map((item) => item.work_center_id || 0))
  );

  return (
    <section className="mb-5 rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-950">
        Enterprise Gantt Scheduling Board
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        Machine-lane planning with material, conflicts, operators, and schedule type.
      </p>

      {schedules.length === 0 ? (
        <div className="rounded-xl border p-8 text-sm text-gray-500">
          No schedules found.
        </div>
      ) : (
        <div className="space-y-5 overflow-x-auto">
          {workCenterIds.map((wcId) => {
            const laneSchedules = schedules.filter(
              (item) => Number(item.work_center_id || 0) === Number(wcId)
            );

            return (
              <div key={wcId} className="min-w-[900px] rounded-xl border bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold">
                  <Factory size={16} />
                  {getWorkCenterName(wcId)}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {laneSchedules.map((item) => (
                    <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{getOrderName(item.order_id)}</p>
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={12} />
                            {item.schedule_date} · {item.start_time}-{item.end_time}
                          </p>
                        </div>

                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          {item.schedule_type || "Manual"}
                        </span>
                      </div>

                      <div className="mb-1 flex justify-between text-xs">
                        <span>Capacity</span>
                        <strong>{Number(item.capacity_load || 0)}%</strong>
                      </div>

                      <div className="mb-3 h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{
                            width: `${Math.min(100, Number(item.capacity_load || 0))}%`,
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className={`rounded-full px-2 py-1 font-semibold ${materialClass(item.material_status)}`}>
                          {item.material_status || "Unchecked"}
                        </span>
                        <span className={`rounded-full px-2 py-1 font-semibold ${conflictClass(item.conflict_status)}`}>
                          {item.conflict_status || "Clear"}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-gray-500">
                        Operator: {item.assigned_operator || "Unassigned"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}