import {
  Download,
  RefreshCw,
  Shuffle,
  Wand2,
} from "lucide-react";

interface Props {
  actionLoading: string;
  onAutoGenerate: () => void;
  onReallocate: () => void;
  onRefresh: () => void;
  onExport: () => void;
}

export default function SchedulingActions({
  actionLoading,
  onAutoGenerate,
  onReallocate,
  onRefresh,
  onExport,
}: Props) {
  return (
    <div className="mb-5 flex flex-wrap gap-3">
      <button
        onClick={onAutoGenerate}
        disabled={actionLoading === "auto"}
        className="rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold"
      >
        <div className="flex items-center gap-2">
          <Wand2 size={16} />
          Auto Optimize Schedule
        </div>
      </button>

      <button
        onClick={onReallocate}
        disabled={actionLoading === "reallocate"}
        className="rounded-xl bg-orange-600 px-4 py-2 text-white font-semibold"
      >
        <div className="flex items-center gap-2">
          <Shuffle size={16} />
          Reallocate Machines
        </div>
      </button>

      <button
        onClick={onRefresh}
        className="rounded-xl bg-gray-800 px-4 py-2 text-white font-semibold"
      >
        <div className="flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh
        </div>
      </button>

      <button
        onClick={onExport}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold"
      >
        <div className="flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </div>
      </button>
    </div>
  );
}