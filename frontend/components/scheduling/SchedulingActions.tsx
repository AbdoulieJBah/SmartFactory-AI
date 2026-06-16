import { Bot, Download, Gauge, Shuffle } from "lucide-react";

export default function SchedulingActions({
  actionLoading,
  onAutoGenerate,
  onReallocate,
  onRefresh,
  onExport,
}: {
  actionLoading: string;
  onAutoGenerate: () => void;
  onReallocate: () => void;
  onRefresh: () => void;
  onExport: () => void;
}) {
  return (
    <section className="mb-5 rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">Enterprise Scheduling Actions</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <button
          onClick={onAutoGenerate}
          disabled={!!actionLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
        >
          <Bot size={18} />
          {actionLoading === "auto" ? "Optimizing..." : "Auto Optimize"}
        </button>

        <button
          onClick={onReallocate}
          disabled={!!actionLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
        >
          <Shuffle size={18} />
          {actionLoading === "reallocate" ? "Reallocating..." : "Reallocate Machines"}
        </button>

        <button
          onClick={onRefresh}
          className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 font-semibold text-white hover:bg-gray-800"
        >
          <Gauge size={18} />
          Refresh Capacity
        </button>

        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>
    </section>
  );
}