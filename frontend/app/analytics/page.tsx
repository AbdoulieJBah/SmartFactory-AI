"use client";

import Sidebar from "@/components/Sidebar";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const productionData = [
  { day: "Mon", output: 120 },
  { day: "Tue", output: 220 },
  { day: "Wed", output: 180 },
  { day: "Thu", output: 300 },
  { day: "Fri", output: 500 },
];

const wasteData = [
  { material: "Lettuce", waste: 35 },
  { material: "Tomatoes", waste: 20 },
  { material: "Packaging", waste: 12 },
  { material: "Cucumber", waste: 18 },
];

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="ml-72 min-h-screen flex-1 p-8">
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-gray-500 mb-8">
          Production, waste, inventory, and efficiency insights
        </p>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-gray-500">OEE Estimate</h2>
            <p className="text-3xl font-bold mt-2">82%</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-gray-500">Waste Rate</h2>
            <p className="text-3xl font-bold mt-2">4.8%</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-gray-500">Efficiency</h2>
            <p className="text-3xl font-bold mt-2">91%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">
              Production Output Trend
            </h2>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productionData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="output" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">
              Waste by Material
            </h2>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wasteData}>
                  <XAxis dataKey="material" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="waste" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
