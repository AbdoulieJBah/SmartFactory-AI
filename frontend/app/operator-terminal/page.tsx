"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api } from "../lib/api";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Home,
  Keyboard,
  Lock,
  Menu,
  Pause,
  Play,
  RefreshCw,
  Save,
  Search,
  Settings,
  Square,
  Trash2,
  X,
} from "lucide-react";

type Primitive = string | number | boolean | null | undefined;
type ApiRecord = Record<string, Primitive>;

interface OperatorOrder {
  id: number;
  withdrawalDate: string;
  status: string;
  orderState: string;
  customerCode: string;
  customer: string;
  destination: string;
  description: string;
  article: string;
  lot: string;
  orderedQty: number;
  producedQty: number;
  remainingQty: number;
  unit: string;
  dueTime: string;
  phase: string;
  line: string;
}

interface WorkCenter {
  id: number;
  name: string;
  status: string;
}

interface ComponentRow {
  code: string;
  description: string;
  unit: string;
  planned: number;
  available: number;
  lot: string;
  consumed: number;
}

type ActivityStatus = "idle" | "running" | "paused" | "completed";

interface TerminalEvent {
  time: string;
  message: string;
  tone: "info" | "success" | "warning" | "danger";
}

const fallbackOrders: OperatorOrder[] = [
  {
    id: 1,
    withdrawalDate: "Today 14:30",
    status: "SCHEDULED",
    orderState: "Released",
    customerCode: "FG",
    customer: "Finished Goods Plan",
    destination: "Cold Dispatch Area",
    description: "Mixed Salad 250g",
    article: "SALAD-250G",
    lot: "LOT-SALAD-250G",
    orderedQty: 1800,
    producedQty: 0,
    remainingQty: 1800,
    unit: "pack",
    dueTime: "14:30",
    phase: "Production / Packing",
    line: "PACKAGINGLINEA",
  },
  {
    id: 2,
    withdrawalDate: "Today 17:00",
    status: "SCHEDULED",
    orderState: "Released",
    customerCode: "FG",
    customer: "Finished Goods Plan",
    destination: "Cold Dispatch Area",
    description: "Family Salad 500g",
    article: "SALAD-500G",
    lot: "LOT-SALAD-500G",
    orderedQty: 950,
    producedQty: 300,
    remainingQty: 650,
    unit: "pack",
    dueTime: "17:00",
    phase: "Production / Packing",
    line: "PACKAGINGLINEB",
  },
  {
    id: 3,
    withdrawalDate: "Today 21:00",
    status: "PLANNED",
    orderState: "Planned",
    customerCode: "RM",
    customer: "Internal Production",
    destination: "Washing / Prep",
    description: "Fresh Lettuce 1kg",
    article: "LETTUCE-1KG",
    lot: "LOT-LETTUCE-1KG",
    orderedQty: 1200,
    producedQty: 360,
    remainingQty: 840,
    unit: "kg",
    dueTime: "21:00",
    phase: "Washing / Prep",
    line: "WASHINGLINE",
  },
  {
    id: 4,
    withdrawalDate: "Today 19:30",
    status: "PLANNED",
    orderState: "Planned",
    customerCode: "RM",
    customer: "Internal Production",
    destination: "Mixing Station",
    description: "Carrot 1kg",
    article: "CARROT-1KG",
    lot: "LOT-CARROT-1KG",
    orderedQty: 800,
    producedQty: 0,
    remainingQty: 800,
    unit: "kg",
    dueTime: "19:30",
    phase: "Mixing / Prep",
    line: "MIXINGSTATION",
  },
];

const fallbackWorkCenters: WorkCenter[] = [
  { id: 1, name: "PACKAGINGLINEA", status: "Running" },
  { id: 2, name: "PACKAGINGLINEB", status: "Idle" },
  { id: 3, name: "MIXINGSTATION", status: "Running" },
  { id: 4, name: "WASHINGLINE", status: "Maintenance" },
];

const fallbackComponents: ComponentRow[] = [
  { code: "LETTUCE-1KG", description: "FRESH LETTUCE 1KG", unit: "KG", planned: 113.68, available: 240, lot: "COLD ROOM A", consumed: 0 },
  { code: "CARROT-1KG", description: "CARROT 1KG", unit: "KG", planned: 60, available: 390, lot: "COLD ROOM B", consumed: 0 },
  { code: "PACK-BOX", description: "PACKAGING BOX", unit: "PCS", planned: 360, available: 960, lot: "DRY GOODS", consumed: 0 },
  { code: "SALAD-250G", description: "MIXED SALAD 250G", unit: "PACK", planned: 1800, available: 1800, lot: "FG PLAN", consumed: 0 },
  { code: "SALAD-500G", description: "FAMILY SALAD 500G", unit: "PACK", planned: 950, available: 950, lot: "FG PLAN", consumed: 0 },
];

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : [];
}

function text(value: Primitive, fallback = "") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function num(value: Primitive, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDueDate(value: Primitive, fallback: string) {
  const raw = text(value, "");

  if (!raw) return fallback;

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapOrder(
  record: ApiRecord,
  index: number,
  products: ApiRecord[],
  workCenters: WorkCenter[]
): OperatorOrder {
  const fallback = fallbackOrders[index % fallbackOrders.length];
  const productId = num(record.product_id, num(fallback.id));
  const product = products.find((item) => num(item.id) === productId);
  const workCenter = workCenters.find((item) => item.id === num(record.work_center_id));
  const orderedQty = num(record.target_quantity, fallback.orderedQty);
  const producedQty = num(record.produced_quantity, fallback.producedQty);
  const productName = text(product?.name, fallback.description);
  const sku = text(product?.sku, fallback.article);
  const unit = text(product?.unit, fallback.unit);
  const line = workCenter?.name || fallback.line;

  return {
    ...fallback,
    id: num(record.id, fallback.id),
    withdrawalDate: formatDueDate(record.end_date || record.start_date, fallback.withdrawalDate),
    status: text(record.status, fallback.status).toUpperCase(),
    orderState: text(record.status, fallback.orderState),
    customerCode: "SF",
    customer: "SmartFactory Production",
    destination: line.includes("PACKAGING") ? "Finished Goods / Dispatch" : "Production Area",
    description: productName,
    article: sku,
    lot: `LOT-${sku}-${String(num(record.id, index + 1)).padStart(3, "0")}`,
    orderedQty,
    producedQty,
    remainingQty: Math.max(0, orderedQty - producedQty),
    unit,
    phase: line.includes("WASH")
      ? "Washing / Prep"
      : line.includes("MIX")
        ? "Mixing / Prep"
        : "Production / Packing",
    line,
  };
}

function mapWorkCenter(record: ApiRecord, index: number): WorkCenter {
  const fallback = fallbackWorkCenters[index % fallbackWorkCenters.length];

  return {
    id: num(record.id, fallback.id),
    name: text(record.name, fallback.name).toUpperCase().replace(/\s+/g, ""),
    status: text(record.status, fallback.status),
  };
}

function toolbarButton(icon: React.ReactNode, label: string, active = false, onClick?: () => void) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm shadow-sm ${
        active
          ? "border-yellow-500 bg-yellow-500 text-white"
          : "border-yellow-200 bg-yellow-100 text-yellow-800"
      }`}
    >
      {icon}
    </button>
  );
}

function FieldBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded border border-gray-300 bg-white">
      <div className="border-b border-gray-200 bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
        {label}
      </div>
      <div className={`min-h-12 px-2 py-2 text-sm font-semibold ${highlight ? "bg-lime-100 text-lime-900" : "text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}

function BigAction({
  children,
  active,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-14 rounded border px-4 text-sm font-bold shadow-sm ${
        disabled
          ? "border-gray-200 bg-gray-100 text-gray-400"
          : active
            ? "border-lime-500 bg-lime-400 text-lime-950"
            : "border-gray-300 bg-white text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function OperatorTerminalPage() {
  const [orders, setOrders] = useState<OperatorOrder[]>(fallbackOrders);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>(fallbackWorkCenters);
  const [components, setComponents] = useState<ComponentRow[]>(fallbackComponents);
  const [selectedLine, setSelectedLine] = useState("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState(fallbackOrders[0].id);
  const [operator, setOperator] = useState("02");
  const [usingFallback, setUsingFallback] = useState(false);
  const [view, setView] = useState<"orders" | "machine">("machine");
  const [activityStatus, setActivityStatus] = useState<ActivityStatus>("idle");
  const [quantityInput, setQuantityInput] = useState("10");
  const [pauseReason, setPauseReason] = useState("Material changeover");
  const [events, setEvents] = useState<TerminalEvent[]>([
    {
      time: "20:02",
      message: "Operator terminal initialized.",
      tone: "info",
    },
  ]);

  function addEvent(message: string, tone: TerminalEvent["tone"] = "info") {
    setEvents((previous) => [
      {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        message,
        tone,
      },
      ...previous,
    ].slice(0, 8));
  }

  async function loadData() {
    const [ordersRes, workCentersRes, inventoryRes, productsRes] = await Promise.allSettled([
      api.get("/production-orders/"),
      api.get("/work-centers/"),
      api.get("/inventory/"),
      api.get("/products/"),
    ]);

    const rawOrders = ordersRes.status === "fulfilled" ? safeArray<ApiRecord>(ordersRes.value.data) : [];
    const rawWorkCenters = workCentersRes.status === "fulfilled" ? safeArray<ApiRecord>(workCentersRes.value.data) : [];
    const rawInventory = inventoryRes.status === "fulfilled" ? safeArray<ApiRecord>(inventoryRes.value.data) : [];
    const rawProducts = productsRes.status === "fulfilled" ? safeArray<ApiRecord>(productsRes.value.data) : [];

    const nextWorkCenters = rawWorkCenters.length > 0 ? rawWorkCenters.map(mapWorkCenter) : fallbackWorkCenters;
    const nextOrders = rawOrders.length > 0 ? rawOrders.map((item, index) => mapOrder(item, index, rawProducts, nextWorkCenters)) : fallbackOrders;
    const nextComponents =
      rawInventory.length > 0
        ? rawInventory.slice(0, 6).map((item, index) => {
            const product = rawProducts.find(
              (candidate) => num(candidate.id) === num(item.product_id)
            );
            const fallback = fallbackComponents[index % fallbackComponents.length];

            return {
              code: text(product?.sku, `MAT${String(index + 1).padStart(5, "0")}`),
              description: text(product?.name, fallback.description).toUpperCase(),
              unit: text(product?.unit, fallback.unit).toUpperCase(),
              planned: num(item.reserved_quantity, fallback.planned),
              available: num(item.quantity, fallback.available),
              lot: text(item.warehouse, fallback.lot),
              consumed: 0,
            };
          })
        : fallbackComponents;

    setOrders(nextOrders);
    setWorkCenters(nextWorkCenters);
    setComponents(nextComponents);
    setSelectedOrderId((previous) => nextOrders.find((order) => order.id === previous)?.id || nextOrders[0]?.id || fallbackOrders[0].id);
    setSelectedLine((previous) => {
      if (previous === "ALL" || nextWorkCenters.some((line) => line.name === previous)) {
        return previous;
      }

      return nextOrders[0]?.line || nextWorkCenters[0]?.name || fallbackWorkCenters[0].name;
    });
    setUsingFallback(
      ordersRes.status === "rejected" ||
        workCentersRes.status === "rejected" ||
        rawOrders.length === 0 ||
        rawWorkCenters.length === 0
    );
    addEvent("Terminal data refreshed from SmartFactory AI.", "success");
  }

  useEffect(() => {
    loadData();
    // loadData is the initial terminal bootstrap and should run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleOrders = useMemo(
    () => orders.filter((order) => order.line === selectedLine || selectedLine === "ALL"),
    [orders, selectedLine]
  );

  const currentOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || visibleOrders[0] || fallbackOrders[0],
    [orders, selectedOrderId, visibleOrders]
  );

  const currentLine = workCenters.find((line) => line.name === selectedLine) || workCenters[0] || fallbackWorkCenters[0];
  const completion = currentOrder.orderedQty > 0 ? (currentOrder.producedQty / currentOrder.orderedQty) * 100 : 0;
  const machineStatus =
    activityStatus === "running"
      ? "RUNNING"
      : activityStatus === "paused"
        ? "PAUSED"
        : activityStatus === "completed"
          ? "COMPLETED"
          : currentLine.status.toUpperCase();

  function selectOrder(orderId: number) {
    setSelectedOrderId(orderId);
    setView("machine");
    setActivityStatus("idle");
    addEvent(`Work order ${orderId} selected.`, "info");
  }

  function updateCurrentOrder(updater: (order: OperatorOrder) => OperatorOrder) {
    setOrders((previous) =>
      previous.map((order) => (order.id === currentOrder.id ? updater(order) : order))
    );
  }

  function startActivity() {
    setActivityStatus("running");
    updateCurrentOrder((order) => ({
      ...order,
      status: "RUNNING",
      orderState: "In production",
    }));
    addEvent(`Activity started for work order ${currentOrder.id}.`, "success");
  }

  function suspendActivity() {
    setActivityStatus("paused");
    updateCurrentOrder((order) => ({
      ...order,
      status: "PAUSED",
      orderState: "Paused",
    }));
    addEvent(`Activity paused: ${pauseReason}.`, "warning");
  }

  function endActivity() {
    setActivityStatus("completed");
    updateCurrentOrder((order) => ({
      ...order,
      status: order.remainingQty <= 0 ? "COMPLETED" : "PARTIAL",
      orderState: order.remainingQty <= 0 ? "Completed" : "Partial",
    }));
    addEvent(`Activity ended for work order ${currentOrder.id}.`, "success");
  }

  async function recordProduction() {
    const quantity = Math.max(0, Math.min(num(quantityInput), currentOrder.remainingQty));

    if (quantity <= 0) {
      addEvent("Enter a valid production quantity.", "danger");
      return;
    }

    updateCurrentOrder((order) => {
      const producedQty = order.producedQty + quantity;
      const remainingQty = Math.max(0, order.orderedQty - producedQty);

      return {
        ...order,
        producedQty,
        remainingQty,
        status: remainingQty === 0 ? "COMPLETED" : "RUNNING",
        orderState: remainingQty === 0 ? "Completed" : "In production",
      };
    });

    setActivityStatus(currentOrder.remainingQty - quantity <= 0 ? "completed" : "running");
    addEvent(`Production recorded: ${quantity} ${currentOrder.unit}.`, "success");

    try {
      await api.post("/production-logs/", {
        production_order_id: currentOrder.id,
        quantity_produced: quantity,
        operator_name: operator,
        notes: `Operator terminal ${selectedLine} - lot ${currentOrder.lot}`,
      });
      addEvent("Production log saved to backend.", "success");
    } catch {
      addEvent("Backend production-log failed; terminal state kept locally.", "warning");
    }
  }

  function confirmConsumption(code: string) {
    setComponents((previous) =>
      previous.map((item) =>
        item.code === code
          ? {
              ...item,
              consumed: item.planned,
              available: Math.max(0, item.available - item.planned),
            }
          : item
      )
    );
    addEvent(`Component consumption confirmed: ${code}.`, "success");
  }

  function resetTerminal() {
    setActivityStatus("idle");
    setQuantityInput("10");
    setComponents((previous) => previous.map((item) => ({ ...item, consumed: 0 })));
    addEvent("Operator terminal reset.", "info");
  }

  return (
    <div className="min-h-screen bg-gray-200 text-gray-900">
      <Sidebar />

      <main className="ml-72 min-h-screen p-4">
        <div className="overflow-hidden rounded-lg border border-gray-400 bg-[#eef1f4] shadow-sm">
          <header className="border-b border-gray-300 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-8 text-sm font-semibold text-gray-700">
                <span>Operator Terminal</span>
                <span>Shop Floor Execution</span>
              </div>
              <div className="flex items-center gap-2">
                {usingFallback && (
                  <span className="rounded border border-yellow-300 bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                    DEMO DATA
                  </span>
                )}
                <span className="text-xs text-gray-500">Live SmartFactory Data</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {toolbarButton(<Home size={18} />, "Home", true, resetTerminal)}
              {toolbarButton(<Lock size={18} />, "Lock")}
              {toolbarButton(<Check size={18} />, "Confirm", false, recordProduction)}
              {toolbarButton(<X size={18} />, "Cancel", false, suspendActivity)}
              {toolbarButton(<Trash2 size={18} />, "Reset", false, resetTerminal)}
              {toolbarButton(<ArrowLeft size={18} />, "Previous", false, () => {
                const index = Math.max(0, visibleOrders.findIndex((order) => order.id === currentOrder.id) - 1);
                selectOrder(visibleOrders[index]?.id || currentOrder.id);
              })}
              {toolbarButton(<ArrowRight size={18} />, "Next", false, () => {
                const index = visibleOrders.findIndex((order) => order.id === currentOrder.id);
                const next = visibleOrders[Math.min(visibleOrders.length - 1, index + 1)];
                selectOrder(next?.id || currentOrder.id);
              })}
              {toolbarButton(<Save size={18} />, "Save", false, recordProduction)}
              {toolbarButton(<RefreshCw size={18} />, "Refresh", false, loadData)}

              <div className="ml-3 flex h-10 min-w-72 items-center rounded border border-gray-300 bg-white px-3">
                <Search size={16} className="mr-2 text-yellow-700" />
                <input
                  value={selectedLine}
                  onChange={(event) => setSelectedLine(event.target.value.toUpperCase())}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                />
              </div>

              {toolbarButton(<Settings size={18} />, "Settings", true)}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
              <Link href="/production-orders" className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                Production Orders
              </Link>
              <Link href="/scheduling" className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                Scheduling
              </Link>
              <Link href="/inventory" className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                Inventory
              </Link>
              <Link href="/quality" className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                Quality
              </Link>
              <Link href="/downtime" className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                Downtime
              </Link>
              <Link href="/production-manager" className="rounded border border-lime-200 bg-lime-50 px-3 py-1 text-lime-700">
                Production Manager
              </Link>
            </div>
          </header>

          <div className="border-b border-gray-300 bg-[#f7f8fa] px-4 py-2">
            <div className="flex gap-8 text-sm font-bold text-yellow-700">
              <button onClick={() => setView("orders")} className={view === "orders" ? "border-b-2 border-yellow-600 pb-2" : "pb-2"}>
                Work Order Queue
              </button>
              <button onClick={() => setView("machine")} className={view === "machine" ? "border-b-2 border-yellow-600 pb-2" : "pb-2"}>
                Machine Dashboard
              </button>
              <span className="pb-2">Machine Data</span>
              <span className="pb-2">Utilities</span>
            </div>
          </div>

          <section className="border-b border-gray-300 bg-white px-4 py-3">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_1fr]">
              <div className="grid grid-cols-[90px_150px_42px_1fr] items-end gap-2">
                <label className="text-sm font-bold text-gray-600">Resource</label>
                <select
                  value={selectedLine}
                  onChange={(event) => setSelectedLine(event.target.value)}
                  className="h-10 rounded border border-gray-300 bg-lime-200 px-2 font-bold"
                >
                  {["ALL", ...workCenters.map((line) => line.name)].map((line) => (
                    <option key={line}>{line}</option>
                  ))}
                </select>
                <button className="flex h-10 items-center justify-center rounded bg-yellow-500 text-white">
                  <Search size={18} />
                </button>
                <span className="font-bold text-gray-700">{selectedLine === "ALL" ? "All work centers" : selectedLine}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                    <BigAction onClick={() => setView("orders")}>Select / Edit</BigAction>
                    <BigAction onClick={() => addEvent("Order moved earlier in the local terminal sequence.", "info")}>Move Up</BigAction>
                    <BigAction onClick={() => addEvent("Order moved later in the local terminal sequence.", "info")}>Move Down</BigAction>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <FieldBox label="From Date" value="Today" />
                <FieldBox label="To Date" value="Next 7 days" />
                <FieldBox label="Work Order Status" value="Scheduled" />
              </div>
            </div>
          </section>

          {view === "orders" ? (
            <section className="bg-white p-4">
              <div className="overflow-x-auto rounded border border-gray-300">
                <table className="min-w-[1280px] w-full border-collapse text-left text-sm">
                  <thead className="bg-[#edf1f5] text-xs uppercase text-gray-600">
                    <tr>
                      <th className="border px-2 py-2">T</th>
                      <th className="border px-2 py-2">Due Time</th>
                      <th className="border px-2 py-2">Status</th>
                      <th className="border px-2 py-2">Order State</th>
                      <th className="border px-2 py-2">Source</th>
                      <th className="border px-2 py-2">Destination</th>
                      <th className="border px-2 py-2">Product</th>
                      <th className="border px-2 py-2">Ordered Qty</th>
                      <th className="border px-2 py-2">Unit</th>
                      <th className="border px-2 py-2">Remaining Qty</th>
                      <th className="border px-2 py-2">Lot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((order, index) => (
                      <tr
                        key={order.id}
                        onClick={() => selectOrder(order.id)}
                        className={`cursor-pointer font-mono ${currentOrder.id === order.id ? "bg-yellow-100" : index % 2 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <td className="border px-2 py-2">*</td>
                        <td className="border px-2 py-2">{order.withdrawalDate}</td>
                        <td className="border px-2 py-2">{order.status}</td>
                        <td className="border px-2 py-2">{order.orderState}</td>
                        <td className="border px-2 py-2">{order.customerCode} {order.customer}</td>
                        <td className="border px-2 py-2">{order.destination}</td>
                        <td className="border px-2 py-2">{order.description}</td>
                        <td className="border px-2 py-2 text-right">{order.orderedQty.toLocaleString()}</td>
                        <td className="border px-2 py-2">{order.unit}</td>
                        <td className="border px-2 py-2 text-right">{order.remainingQty.toLocaleString()}</td>
                        <td className="border px-2 py-2">{order.lot}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-mono font-bold">
                    <tr>
                      <td colSpan={7} className="border px-2 py-2 text-right">Total</td>
                      <td className="border px-2 py-2 text-right">
                        {visibleOrders.reduce((sum, item) => sum + item.orderedQty, 0).toLocaleString()}
                      </td>
                      <td className="border px-2 py-2">CO</td>
                      <td className="border px-2 py-2 text-right">
                        {visibleOrders.reduce((sum, item) => sum + item.remainingQty, 0).toLocaleString()}
                      </td>
                      <td className="border px-2 py-2" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          ) : (
            <section className="bg-[#f7f8fa] p-4">
              <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.2fr_1fr_340px]">
                <div className="space-y-4">
                  <div className="grid grid-cols-[1fr_42px_1.2fr] gap-2">
                    <div className="rounded border border-gray-300 bg-white">
                      <div className="border-b border-gray-200 bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                        Operator
                      </div>
                      <input
                        value={operator}
                        onChange={(event) => setOperator(event.target.value)}
                        className="min-h-12 w-full bg-lime-100 px-2 py-2 text-sm font-semibold text-lime-900 outline-none"
                      />
                    </div>
                    <button className="flex items-center justify-center rounded bg-yellow-500 text-white">
                      <Search size={18} />
                    </button>
                    <FieldBox label="Shift" value="SHIFT 2" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <BigAction onClick={() => addEvent(`Shift started by operator ${operator}.`, "success")}>Start Shift</BigAction>
                    <BigAction onClick={() => addEvent(`Shift ended by operator ${operator}.`, "warning")}>End Shift</BigAction>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldBox label="Active Work Order" value={currentOrder.id} />
                    <FieldBox label="Phase" value={currentOrder.phase} />
                  </div>

                  <FieldBox label="Source" value={`${currentOrder.customerCode} ${currentOrder.customer}`} />
                  <FieldBox label="Destination" value={currentOrder.destination} />

                  <div className="grid grid-cols-2 gap-3">
                    <BigAction onClick={() => setView("orders")}>Planned Orders</BigAction>
                    <BigAction active={activityStatus === "running"} onClick={startActivity}>Start Machine Data</BigAction>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FieldBox label="SKU" value={currentOrder.article} />
                    <FieldBox label="Due Date" value={currentOrder.withdrawalDate.slice(0, 8)} />
                  </div>

                  <FieldBox label="Product" value={currentOrder.description} />

                  <div className="grid grid-cols-3 gap-3">
                    <FieldBox label="Lot" value={currentOrder.lot} />
                    <FieldBox label="Expiry" value="31/12/26" />
                    <FieldBox label="Due Time" value={currentOrder.dueTime} />
                  </div>

                  <FieldBox label="Operator Notes" value="Verify lot, packaging, label, weight, and allergen controls before start." />

                  <div className="grid grid-cols-3 gap-3">
                    <BigAction active={activityStatus === "running"} onClick={recordProduction}>Record Output</BigAction>
                    <BigAction onClick={() => {
                      setComponents((previous) => previous.map((item) => ({ ...item, consumed: item.planned, available: Math.max(0, item.available - item.planned) })));
                      addEvent("Component consumption confirmed for the active work order.", "success");
                    }}>Confirm Materials</BigAction>
                    <BigAction onClick={endActivity}>End Machine Data</BigAction>
                  </div>
                </div>

                <aside className="space-y-4 rounded border border-gray-300 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-700">Machine State</h2>
                    <span className="rounded bg-gray-200 px-3 py-1 font-bold">{currentLine.name}</span>
                  </div>
                  <div className={`rounded border px-3 py-2 text-center text-sm font-bold ${
                    activityStatus === "running"
                      ? "border-lime-400 bg-lime-100 text-lime-800"
                      : activityStatus === "paused"
                        ? "border-yellow-400 bg-yellow-100 text-yellow-800"
                        : activityStatus === "completed"
                          ? "border-blue-400 bg-blue-100 text-blue-800"
                          : "border-gray-300 bg-gray-100 text-gray-700"
                  }`}>
                    {machineStatus}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded border bg-[#eef3f7] p-4 text-center">
                      <p className="text-3xl font-bold">20:02</p>
                      <p className="mt-1 text-xs">Thursday<br />18 June 2026</p>
                    </div>
                    <div className="rounded border bg-[#eef3f7] p-4 text-center">
                      <p className="text-sm font-bold">Counter</p>
                      <p className="mt-4 text-3xl font-bold">{currentOrder.producedQty}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldBox label="Ordered Qty" value={currentOrder.orderedQty} />
                    <FieldBox label="Remaining Qty" value={currentOrder.remainingQty} />
                  </div>

                  <div className="rounded border bg-gray-50 p-3">
                    <label className="text-xs font-bold text-gray-600">Production Quantity</label>
                    <div className="mt-2 grid grid-cols-[1fr_90px] gap-2">
                      <input
                        type="number"
                        min="0"
                        value={quantityInput}
                        onChange={(event) => setQuantityInput(event.target.value)}
                        className="rounded border border-gray-300 px-3 py-2 text-lg font-bold outline-none"
                      />
                      <button
                        onClick={recordProduction}
                        className="rounded bg-lime-500 px-3 py-2 font-bold text-lime-950"
                      >
                        Record
                      </button>
                    </div>
                  </div>

                  <div className="rounded border bg-gray-50 p-3">
                    <div className="mb-2 flex justify-between text-xs font-bold">
                      <span>Progress</span>
                      <span>{completion.toFixed(0)}%</span>
                    </div>
                    <div className="h-4 rounded bg-white">
                      <div className="h-4 rounded bg-lime-500" style={{ width: `${Math.min(100, completion)}%` }} />
                    </div>
                  </div>
                </aside>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
                <div className="overflow-x-auto rounded border border-gray-300 bg-white">
                  <table className="min-w-[920px] w-full border-collapse text-left text-sm">
                    <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                      <tr>
                        <th className="border px-2 py-2">Component</th>
                        <th className="border px-2 py-2">Description</th>
                        <th className="border px-2 py-2">Unit</th>
                        <th className="border px-2 py-2">Planned</th>
                        <th className="border px-2 py-2">Available</th>
                        <th className="border px-2 py-2">Location / Lot</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {components.map((item) => (
                        <tr key={item.code} className={item.available <= 0 ? "bg-red-50" : item.consumed > 0 ? "bg-lime-50" : "bg-white"}>
                          <td className="border px-2 py-2">{item.code}</td>
                          <td className="border px-2 py-2">{item.description}</td>
                          <td className="border px-2 py-2">{item.unit}</td>
                          <td className="border px-2 py-2 text-right">{item.planned.toLocaleString()}</td>
                          <td className="border px-2 py-2 text-right">{item.available.toLocaleString()}</td>
                          <td className="border px-2 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span>{item.lot}</span>
                              <button
                                onClick={() => confirmConsumption(item.code)}
                                className="rounded bg-blue-500 px-2 py-1 text-xs font-bold text-white"
                              >
                                Consume
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={startActivity} className="flex h-20 items-center justify-center gap-2 rounded bg-lime-500 text-lg font-bold text-lime-950 shadow">
                    <Play size={22} />
                    Start Activity
                  </button>
                  <button onClick={endActivity} className="flex h-20 items-center justify-center gap-2 rounded bg-red-500 text-lg font-bold text-white shadow">
                    <Square size={22} />
                    End Activity
                  </button>
                  <button onClick={suspendActivity} className="flex h-16 items-center justify-center gap-2 rounded bg-yellow-400 font-bold text-yellow-950 shadow">
                    <Pause size={20} />
                    Pause
                  </button>
                  <button onClick={() => addEvent(`Work order ${currentOrder.id} detail: ${currentOrder.description}.`, "info")} className="flex h-16 items-center justify-center gap-2 rounded bg-blue-500 font-bold text-white shadow">
                    <ClipboardList size={20} />
                    Details
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
                <div className="rounded border border-gray-300 bg-white p-3">
                  <label className="text-xs font-bold text-gray-600">Pause Reason</label>
                  <select
                    value={pauseReason}
                    onChange={(event) => setPauseReason(event.target.value)}
                    className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm font-semibold outline-none"
                  >
                    <option>Material changeover</option>
                    <option>Line sanitation</option>
                    <option>Quality hold</option>
                    <option>Machine fault</option>
                    <option>Waiting for raw material</option>
                  </select>
                </div>

                <div className="rounded border border-gray-300 bg-white">
                  <div className="border-b bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600">
                    Terminal Event Log
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y text-sm">
                    {events.map((event, index) => (
                      <div key={`${event.time}-${index}`} className="grid grid-cols-[70px_1fr] gap-2 px-3 py-2">
                        <span className="font-mono font-bold text-gray-500">{event.time}</span>
                        <span className={
                          event.tone === "success"
                            ? "text-lime-700"
                            : event.tone === "warning"
                              ? "text-yellow-700"
                              : event.tone === "danger"
                                ? "text-red-700"
                                : "text-gray-700"
                        }>
                          {event.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          <footer className="flex items-center justify-between border-t border-gray-300 bg-[#dde2e8] px-10 py-3 text-gray-800">
            <Menu size={26} />
            <Keyboard size={26} />
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-yellow-700" />
              <span className="text-sm font-bold">Operator Terminal - {machineStatus} - Work Order {currentOrder.id}</span>
            </div>
            <Menu size={26} />
          </footer>
        </div>
      </main>
    </div>
  );
}
