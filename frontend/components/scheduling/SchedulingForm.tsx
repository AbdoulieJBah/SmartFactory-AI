import { AnyRecord, ScheduleFormState } from "./types";
import { getValue } from "./helpers";

export default function SchedulingForm({
  form,
  setForm,
  orders,
  workCenters,
  onSubmit,
}: {
  form: ScheduleFormState;
  setForm: (value: ScheduleFormState) => void;
  orders: AnyRecord[];
  workCenters: AnyRecord[];
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">Create Manual Schedule</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <select
          value={form.order_id}
          onChange={(e) => setForm({ ...form, order_id: e.target.value })}
          className="rounded-lg border px-3 py-2"
        >
          <option value="">Select Order</option>
          {orders.map((order) => (
            <option key={String(order.id)} value={String(order.id)}>
              {getValue(order, ["order_number", "orderNumber", "id"])}
            </option>
          ))}
        </select>

        <select
          value={form.work_center_id}
          onChange={(e) => setForm({ ...form, work_center_id: e.target.value })}
          className="rounded-lg border px-3 py-2"
        >
          <option value="">Select Work Center</option>
          {workCenters.map((wc) => (
            <option key={String(wc.id)} value={String(wc.id)}>
              {getValue(wc, ["name", "id"])}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={form.schedule_date}
          onChange={(e) => setForm({ ...form, schedule_date: e.target.value })}
          className="rounded-lg border px-3 py-2"
        />

        <select
          value={form.shift}
          onChange={(e) => setForm({ ...form, shift: e.target.value })}
          className="rounded-lg border px-3 py-2"
        >
          <option>Morning</option>
          <option>Afternoon</option>
          <option>Night</option>
        </select>

        <input
          type="time"
          value={form.start_time}
          onChange={(e) => setForm({ ...form, start_time: e.target.value })}
          className="rounded-lg border px-3 py-2"
        />

        <input
          type="time"
          value={form.end_time}
          onChange={(e) => setForm({ ...form, end_time: e.target.value })}
          className="rounded-lg border px-3 py-2"
        />

        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
          className="rounded-lg border px-3 py-2"
        >
          <option>Normal</option>
          <option>High</option>
          <option>Urgent</option>
        </select>

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="rounded-lg border px-3 py-2"
        >
          <option>Planned</option>
          <option>Released</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Delayed</option>
          <option>Cancelled</option>
        </select>

        <input
          type="number"
          value={form.capacity_load}
          onChange={(e) =>
            setForm({ ...form, capacity_load: Number(e.target.value) })
          }
          placeholder="Capacity %"
          className="rounded-lg border px-3 py-2"
        />

        <input
          value={form.assigned_operator}
          onChange={(e) => setForm({ ...form, assigned_operator: e.target.value })}
          placeholder="Assigned Operator"
          className="rounded-lg border px-3 py-2"
        />

        <input
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes"
          className="rounded-lg border px-3 py-2 md:col-span-2"
        />

        <button
          onClick={onSubmit}
          disabled={!form.schedule_date}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300 md:col-span-2"
        >
          Create Manual Schedule
        </button>
      </div>
    </div>
  );
}
