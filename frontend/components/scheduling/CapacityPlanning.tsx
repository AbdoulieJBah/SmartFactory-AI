import { CapacityItem } from "./types";
import { riskClass } from "./helpers";

export default function CapacityPlanning({
  capacity,
}: {
  capacity: CapacityItem[];
}) {
  return (
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
  );
}