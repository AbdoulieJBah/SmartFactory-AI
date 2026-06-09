"use client";

import Sidebar from "../../components/Sidebar";
import {
  CalendarDays,
  Factory,
  Gauge,
  Clock,
  AlertTriangle,
} from "lucide-react";

const schedule = [
  {
    day: "Monday",
    orders: [
      {
        order: "PO-2026-001",
        product: "Mixed Salad 250g",
        line: "Packaging Line A",
        status: "In Progress",
        priority: "High",
      },
      {
        order: "PO-2026-002",
        product: "Lettuce Mix 500g",
        line: "Mixing Station",
        status: "Planned",
        priority: "Normal",
      },
    ],
  },
  {
    day: "Tuesday",
    orders: [
      {
        order: "PO-2026-003",
        product: "Caesar Salad Bowl",
        line: "Packaging Line B",
        status: "Released",
        priority: "Normal",
      },
    ],
  },
  {
    day: "Wednesday",
    orders: [
      {
        order: "PO-2026-004",
        product: "Family Salad Pack",
        line: "Packaging Line A",
        status: "Planned",
        priority: "Urgent",
      },
    ],
  },
];

export default function SchedulingPage() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 overflow-x-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Production Scheduling
          </h1>
          <p className="text-gray-500 mt-2">
            Plan production orders, assign work centers, and monitor capacity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <CalendarDays className="mb-3 text-blue-600" />
            <p className="text-sm text-gray-500">Scheduled Orders</p>
            <p className="text-3xl font-bold mt-2">4</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Factory className="mb-3 text-green-600" />
            <p className="text-sm text-gray-500">Active Lines</p>
            <p className="text-3xl font-bold mt-2">3</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Gauge className="mb-3 text-purple-600" />
            <p className="text-sm text-gray-500">Capacity Utilization</p>
            <p className="text-3xl font-bold mt-2">82%</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Clock className="mb-3 text-orange-600" />
            <p className="text-sm text-gray-500">Avg Lead Time</p>
            <p className="text-3xl font-bold mt-2">1.8d</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {schedule.map((day) => (
            <div
              key={day.day}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold mb-4">
                {day.day}
              </h2>

              <div className="space-y-4">
                {day.orders.map((item) => (
                  <div
                    key={item.order}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">
                          {item.order}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.product}
                        </p>
                      </div>

                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          item.priority === "Urgent"
                            ? "bg-red-100 text-red-700"
                            : item.priority === "High"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600">
                      Work Center: {item.line}
                    </p>

                    <p className="text-sm mt-2">
                      Status:{" "}
                      <span className="font-semibold">
                        {item.status}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" />
            Scheduling Recommendations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Capacity Risk</h3>
              <p className="text-gray-500 mt-1">
                Packaging Line A is highly loaded. Consider moving one order to
                Packaging Line B.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Priority Alert</h3>
              <p className="text-gray-500 mt-1">
                PO-2026-004 is urgent and should be scheduled before normal
                priority orders.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Optimization Opportunity</h3>
              <p className="text-gray-500 mt-1">
                Group similar salad products to reduce machine changeover time.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}