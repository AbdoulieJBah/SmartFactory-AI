interface CapacityItem {
  work_center_id: number;
  work_center_name: string;
  average_capacity_load: number;
  scheduled_orders: number;
  risk: string;
}

export default function CapacityPlanning({
  capacity,
}: {
  capacity: CapacityItem[];
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">
        Capacity Planning
      </h2>

      <div className="space-y-4">
        {capacity.map((item) => (
          <div key={item.work_center_id}>
            <div className="mb-2 flex justify-between">
              <span className="font-medium">
                {item.work_center_name}
              </span>

              <span>{item.average_capacity_load}%</span>
            </div>

            <div className="h-3 rounded-full bg-gray-100">
              <div
                className={`h-3 rounded-full ${
                  item.average_capacity_load >= 90
                    ? "bg-red-600"
                    : item.average_capacity_load >= 75
                    ? "bg-orange-500"
                    : "bg-blue-600"
                }`}
                style={{
                  width: `${item.average_capacity_load}%`,
                }}
              />
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {item.scheduled_orders} scheduled orders
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}