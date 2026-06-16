import { Clock, Trash2 } from "lucide-react";
import { ScheduleItem, AnyRecord } from "./types";
import {
  conflictClass,
  getValue,
  materialClass,
  priorityClass,
  statusClass,
} from "./helpers";

export default function ScheduleCard({
  item,
  orders,
  workCenters,
  onDelete,
  onStatusChange,
}: {
  item: ScheduleItem;
  orders: AnyRecord[];
  workCenters: AnyRecord[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  const getOrderName = (id?: number | null) => {
    const order = orders.find((o) => Number(getValue(o, ["id"], 0)) === Number(id));
    return String(getValue(order || {}, ["order_number", "orderNumber"], id ? `Order ${id}` : "-"));
  };

  const getWorkCenterName = (id?: number | null) => {
    const wc = workCenters.find((w) => Number(getValue(w, ["id"], 0)) === Number(id));
    return String(getValue(wc || {}, ["name"], id ? `Work Center ${id}` : "-"));
  };

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex justify-between gap-3">
        <div>
          <p className="font-semibold">{getOrderName(item.order_id)}</p>
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
        <select
          value={item.status}
          onChange={(e) => onStatusChange(item.id, e.target.value)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
            item.status
          )}`}
        >
          <option>Planned</option>
          <option>Released</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Delayed</option>
          <option>Cancelled</option>
        </select>

        <span className="text-sm font-semibold">
          {Number(item.capacity_load || 0)}%
        </span>
      </div>

      <div className="mt-3 h-2 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-blue-600"
          style={{
            width: `${Math.min(100, Number(item.capacity_load || 0))}%`,
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <span
          className={`rounded-full px-2 py-1 font-semibold ${materialClass(
            item.material_status
          )}`}
        >
          Material: {item.material_status || "Unchecked"}
        </span>

        <span
          className={`rounded-full px-2 py-1 font-semibold ${conflictClass(
            item.conflict_status
          )}`}
        >
          {item.conflict_status || "Clear"}
        </span>

        <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700">
          {item.schedule_type || "Manual"}
        </span>

        <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
          {item.assigned_operator || "Unassigned"}
        </span>
      </div>

      {item.notes && <p className="mt-3 text-sm text-gray-500">{item.notes}</p>}

      <button
        onClick={() => onDelete(item.id)}
        className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-600"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  );
}