"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api } from "../lib/api";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  Factory,
  Gauge,
  Lightbulb,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  ShieldAlert,
  Thermometer,
  Timer,
  Truck,
  UserRound,
  Warehouse,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Primitive = string | number | boolean | null | undefined;
type ApiRecord = Record<string, Primitive>;
type RiskTone = "green" | "blue" | "amber" | "red" | "slate" | "purple";

interface ProductionOrder {
  id: number;
  orderNumber: string;
  productId: number;
  productName: string;
  batch: string;
  lot: string;
  customer: string;
  line: string;
  operator: string;
  shift: string;
  startTime: string;
  dueTime: string;
  orderedQty: number;
  producedQty: number;
  remainingQty: number;
  priority: string;
  status: string;
  qaRelease: "Released" | "Hold" | "Pending";
  materialStatus: "Available" | "Short" | "Unchecked";
}

interface WorkCenter {
  id: number;
  name: string;
  status: string;
  operator: string;
  product: string;
  batch: string;
  shift: string;
  speed: number;
  targetSpeed: number;
  temperature: number;
  allergenClean: boolean;
  sanitationStatus: "Verified" | "Due" | "Hold";
  currentOrderId: number;
}

interface ScheduleItem {
  id: number;
  order_id?: number | null;
  work_center_id?: number | null;
  schedule_date: string;
  shift: string;
  start_time: string;
  end_time: string;
  priority: string;
  status: string;
  capacity_load?: number;
  assigned_operator?: string | null;
  material_status?: string | null;
  conflict_status?: string | null;
}

interface InventoryItem {
  id: number;
  productId: number;
  productName: string;
  warehouse: string;
  quantity: number;
  minStock: number;
  unit: string;
}

interface QualityCheck {
  id: number;
  production_order_id: number;
  check_type: string;
  result: string;
  inspector_name: string;
  defects_count: number;
  corrective_action?: string | null;
}

interface DowntimeRecord {
  id: number;
  work_center_id: number;
  reason: string;
  duration_minutes: number;
  recorded_by: string;
}

interface WasteRecord {
  id: number;
  product_id: number;
  quantity: number;
  reason: string;
  recorded_by: string;
}

interface OeeData {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  downtime_minutes: number;
  total_target: number;
  total_produced: number;
}

interface DashboardData {
  company?: { name?: string };
  kpis?: {
    production_efficiency?: number;
    quality_pass_rate?: number;
    waste_rate?: number;
    low_stock_items?: number;
    open_production_orders?: number;
  };
}

interface ManagerAlert {
  title: string;
  message: string;
  owner: string;
  tone: RiskTone;
}

const today = new Date().toISOString().slice(0, 10);

const fallbackOrders: ProductionOrder[] = [
  {
    id: 1,
    orderNumber: "PO-2026-041",
    productId: 1,
    productName: "Mixed Salad 250g",
    batch: "BATCH-26-041A",
    lot: "LOT-MIX-A1",
    customer: "Lidl Italia",
    line: "Packaging Line A",
    operator: "M. Conteh",
    shift: "Morning",
    startTime: "08:00",
    dueTime: "14:30",
    orderedQty: 1800,
    producedQty: 1260,
    remainingQty: 540,
    priority: "High",
    status: "In Progress",
    qaRelease: "Released",
    materialStatus: "Available",
  },
  {
    id: 2,
    orderNumber: "PO-2026-042",
    productId: 2,
    productName: "Family Salad 500g",
    batch: "BATCH-26-042B",
    lot: "LOT-FAM-B2",
    customer: "Conad",
    line: "Packaging Line B",
    operator: "A. Jallow",
    shift: "Afternoon",
    startTime: "13:00",
    dueTime: "17:00",
    orderedQty: 950,
    producedQty: 300,
    remainingQty: 650,
    priority: "Normal",
    status: "Released",
    qaRelease: "Pending",
    materialStatus: "Available",
  },
  {
    id: 3,
    orderNumber: "PO-2026-043",
    productId: 3,
    productName: "Fresh Lettuce 1kg",
    batch: "BATCH-26-043C",
    lot: "LOT-LET-C3",
    customer: "Carrefour",
    line: "Washing Line",
    operator: "S. Bah",
    shift: "Night",
    startTime: "18:00",
    dueTime: "21:00",
    orderedQty: 1200,
    producedQty: 0,
    remainingQty: 1200,
    priority: "Urgent",
    status: "Planned",
    qaRelease: "Hold",
    materialStatus: "Short",
  },
  {
    id: 4,
    orderNumber: "PO-2026-044",
    productId: 4,
    productName: "Mediterranean Bowl 320g",
    batch: "BATCH-26-044D",
    lot: "LOT-BOWL-D4",
    customer: "Edeka",
    line: "Mixing Station",
    operator: "N. Ceesay",
    shift: "Afternoon",
    startTime: "15:00",
    dueTime: "19:30",
    orderedQty: 700,
    producedQty: 0,
    remainingQty: 700,
    priority: "High",
    status: "Planned",
    qaRelease: "Pending",
    materialStatus: "Available",
  },
];

const fallbackWorkCenters: WorkCenter[] = [
  {
    id: 1,
    name: "Washing Line",
    status: "Running",
    operator: "S. Bah",
    product: "Fresh Lettuce 1kg",
    batch: "BATCH-26-043C",
    shift: "Night",
    speed: 620,
    targetSpeed: 700,
    temperature: 4.2,
    allergenClean: true,
    sanitationStatus: "Verified",
    currentOrderId: 3,
  },
  {
    id: 2,
    name: "Mixing Station",
    status: "Running",
    operator: "N. Ceesay",
    product: "Mediterranean Bowl 320g",
    batch: "BATCH-26-044D",
    shift: "Afternoon",
    speed: 510,
    targetSpeed: 560,
    temperature: 5.1,
    allergenClean: true,
    sanitationStatus: "Verified",
    currentOrderId: 4,
  },
  {
    id: 3,
    name: "Packaging Line A",
    status: "Running",
    operator: "M. Conteh",
    product: "Mixed Salad 250g",
    batch: "BATCH-26-041A",
    shift: "Morning",
    speed: 840,
    targetSpeed: 900,
    temperature: 6.1,
    allergenClean: true,
    sanitationStatus: "Verified",
    currentOrderId: 1,
  },
  {
    id: 4,
    name: "Packaging Line B",
    status: "Idle",
    operator: "A. Jallow",
    product: "Family Salad 500g",
    batch: "BATCH-26-042B",
    shift: "Afternoon",
    speed: 0,
    targetSpeed: 760,
    temperature: 6.4,
    allergenClean: true,
    sanitationStatus: "Due",
    currentOrderId: 2,
  },
];

const fallbackSchedules: ScheduleItem[] = [
  {
    id: 1,
    order_id: 1,
    work_center_id: 3,
    schedule_date: today,
    shift: "Morning",
    start_time: "08:00",
    end_time: "14:30",
    priority: "High",
    status: "In Progress",
    capacity_load: 82,
    assigned_operator: "M. Conteh",
    material_status: "Available",
    conflict_status: "Clear",
  },
  {
    id: 2,
    order_id: 2,
    work_center_id: 4,
    schedule_date: today,
    shift: "Afternoon",
    start_time: "13:00",
    end_time: "17:00",
    priority: "Normal",
    status: "Released",
    capacity_load: 64,
    assigned_operator: "A. Jallow",
    material_status: "Available",
    conflict_status: "Clear",
  },
  {
    id: 3,
    order_id: 3,
    work_center_id: 1,
    schedule_date: today,
    shift: "Night",
    start_time: "18:00",
    end_time: "21:00",
    priority: "Urgent",
    status: "Planned",
    capacity_load: 78,
    assigned_operator: "S. Bah",
    material_status: "Insufficient",
    conflict_status: "Conflict",
  },
  {
    id: 4,
    order_id: 4,
    work_center_id: 2,
    schedule_date: today,
    shift: "Afternoon",
    start_time: "15:00",
    end_time: "19:30",
    priority: "High",
    status: "Planned",
    capacity_load: 71,
    assigned_operator: "N. Ceesay",
    material_status: "Available",
    conflict_status: "Clear",
  },
];

const fallbackInventory: InventoryItem[] = [
  { id: 1, productId: 3, productName: "Fresh Lettuce 1kg", warehouse: "Cold Room A", quantity: 140, minStock: 500, unit: "kg" },
  { id: 2, productId: 5, productName: "Packaging Box", warehouse: "Dry Goods", quantity: 720, minStock: 1000, unit: "pcs" },
  { id: 3, productId: 4, productName: "Carrot 1kg", warehouse: "Cold Room B", quantity: 390, minStock: 400, unit: "kg" },
  { id: 4, productId: 6, productName: "Sealing Film 250mm", warehouse: "Packaging Store", quantity: 18, minStock: 30, unit: "rolls" },
];

const fallbackQuality: QualityCheck[] = [
  { id: 1, production_order_id: 1, check_type: "Weight Check", result: "Pass", inspector_name: "Quality Team A", defects_count: 1 },
  { id: 2, production_order_id: 2, check_type: "Seal Inspection", result: "Warning", inspector_name: "Quality Team B", defects_count: 4, corrective_action: "Adjust film tension" },
  { id: 3, production_order_id: 3, check_type: "Wash Water Temperature", result: "Fail", inspector_name: "Quality Team A", defects_count: 2, corrective_action: "Hold lot pending QA release" },
];

const fallbackDowntime: DowntimeRecord[] = [
  { id: 1, work_center_id: 4, reason: "Film roll changeover", duration_minutes: 22, recorded_by: "Line Lead B" },
  { id: 2, work_center_id: 1, reason: "Sanitation verification", duration_minutes: 18, recorded_by: "QA Supervisor" },
  { id: 3, work_center_id: 3, reason: "Label printer alignment", duration_minutes: 11, recorded_by: "Maintenance" },
];

const fallbackWaste: WasteRecord[] = [
  { id: 1, product_id: 1, quantity: 24, reason: "Packaging damage", recorded_by: "Operator A" },
  { id: 2, product_id: 3, quantity: 36, reason: "Trim loss", recorded_by: "Prep Team" },
];

const fallbackOee: OeeData = {
  availability: 88,
  performance: 76,
  quality: 94,
  oee: 62.9,
  downtime_minutes: 51,
  total_target: 4650,
  total_produced: 1560,
};

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : [];
}

function text(value: Primitive, fallback = "-") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function num(value: Primitive, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function progress(value: number, max = 100) {
  return Math.min(max, Math.max(0, value));
}

function toneClass(tone: RiskTone) {
  const tones: Record<RiskTone, string> = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };

  return tones[tone];
}

function statusTone(status: string): RiskTone {
  const lower = status.toLowerCase();

  if (lower.includes("fail") || lower.includes("hold") || lower.includes("conflict") || lower.includes("short") || lower.includes("insufficient")) {
    return "red";
  }

  if (lower.includes("warning") || lower.includes("idle") || lower.includes("released") || lower.includes("due") || lower.includes("pending")) {
    return "amber";
  }

  if (lower.includes("running") || lower.includes("progress") || lower.includes("pass") || lower.includes("verified") || lower.includes("available")) {
    return "green";
  }

  return "blue";
}

function mapOrder(record: ApiRecord, index: number, products: ApiRecord[]): ProductionOrder {
  const fallback = fallbackOrders[index % fallbackOrders.length];
  const productId = num(record.product_id, fallback.productId);
  const product = products.find((item) => num(item.id) === productId);
  const orderedQty = num(record.target_quantity, fallback.orderedQty);
  const producedQty = num(record.produced_quantity, fallback.producedQty);
  const status = text(record.status, fallback.status);

  return {
    ...fallback,
    id: num(record.id, fallback.id),
    orderNumber: text(record.order_number, fallback.orderNumber),
    productId,
    productName: text(product?.name, fallback.productName),
    batch: `BATCH-${text(record.id, String(index + 1)).padStart(3, "0")}`,
    lot: `LOT-${text(product?.sku, fallback.lot)}`,
    orderedQty,
    producedQty,
    remainingQty: Math.max(0, orderedQty - producedQty),
    priority: text(record.priority, fallback.priority),
    status,
    qaRelease: status.toLowerCase().includes("completed") ? "Released" : fallback.qaRelease,
  };
}

function mapWorkCenter(record: ApiRecord, index: number): WorkCenter {
  const fallback = fallbackWorkCenters[index % fallbackWorkCenters.length];
  const status = text(record.status, fallback.status);
  const running = status.toLowerCase() === "running";

  return {
    ...fallback,
    id: num(record.id, fallback.id),
    name: text(record.name, fallback.name),
    status,
    speed: running ? fallback.speed : 0,
  };
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  tone: RiskTone;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-950">{value}</h2>
        </div>
        <div className={`rounded-lg border p-2 ${toneClass(tone)}`}>{icon}</div>
      </div>
      <p className="mt-3 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-950">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: RiskTone }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(tone)}`}>
      {children}
    </span>
  );
}

export default function ProductionManagerPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<ProductionOrder[]>(fallbackOrders);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>(fallbackWorkCenters);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(fallbackSchedules);
  const [inventory, setInventory] = useState<InventoryItem[]>(fallbackInventory);
  const [quality, setQuality] = useState<QualityCheck[]>(fallbackQuality);
  const [downtime, setDowntime] = useState<DowntimeRecord[]>(fallbackDowntime);
  const [waste, setWaste] = useState<WasteRecord[]>(fallbackWaste);
  const [oee, setOee] = useState<OeeData>(fallbackOee);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedShift, setSelectedShift] = useState("All");

  async function loadTerminalData() {
    setLoading(true);
    setUsingFallback(false);

    const [
      dashboardRes,
      scheduleRes,
      orderRes,
      workCenterRes,
      inventoryRes,
      qualityRes,
      downtimeRes,
      wasteRes,
      oeeRes,
      productRes,
    ] = await Promise.allSettled([
      api.get("/dashboard/"),
      api.get("/scheduling/"),
      api.get("/production-orders/"),
      api.get("/work-centers/"),
      api.get("/inventory/"),
      api.get("/quality-checks/"),
      api.get("/downtime/"),
      api.get("/waste-records/"),
      api.get("/oee/"),
      api.get("/products/"),
    ]);

    const products = productRes.status === "fulfilled" ? safeArray<ApiRecord>(productRes.value.data) : [];
    const rawOrders = orderRes.status === "fulfilled" ? safeArray<ApiRecord>(orderRes.value.data) : [];
    const rawWorkCenters = workCenterRes.status === "fulfilled" ? safeArray<ApiRecord>(workCenterRes.value.data) : [];
    const rawSchedules = scheduleRes.status === "fulfilled" ? safeArray<ScheduleItem>(scheduleRes.value.data) : [];
    const rawInventory = inventoryRes.status === "fulfilled" ? safeArray<ApiRecord>(inventoryRes.value.data) : [];
    const rawQuality = qualityRes.status === "fulfilled" ? safeArray<QualityCheck>(qualityRes.value.data) : [];
    const rawDowntime = downtimeRes.status === "fulfilled" ? safeArray<DowntimeRecord>(downtimeRes.value.data) : [];
    const rawWaste = wasteRes.status === "fulfilled" ? safeArray<WasteRecord>(wasteRes.value.data) : [];
    const anyFailure = [dashboardRes, scheduleRes, orderRes, workCenterRes, inventoryRes, qualityRes, downtimeRes, wasteRes, oeeRes].some(
      (result) => result.status === "rejected"
    );

    setDashboard(dashboardRes.status === "fulfilled" ? dashboardRes.value.data : null);
    setOrders(rawOrders.length > 0 ? rawOrders.map((item, index) => mapOrder(item, index, products)) : fallbackOrders);
    setWorkCenters(rawWorkCenters.length > 0 ? rawWorkCenters.map(mapWorkCenter) : fallbackWorkCenters);
    setSchedules(rawSchedules.length > 0 ? rawSchedules : fallbackSchedules);
    setQuality(rawQuality.length > 0 ? rawQuality : fallbackQuality);
    setDowntime(rawDowntime.length > 0 ? rawDowntime : fallbackDowntime);
    setWaste(rawWaste.length > 0 ? rawWaste : fallbackWaste);

    if (rawInventory.length > 0) {
      setInventory(
        rawInventory.map((item, index) => {
          const fallback = fallbackInventory[index % fallbackInventory.length];
          const productId = num(item.product_id, fallback.productId);
          const product = products.find((entry) => num(entry.id) === productId);

          return {
            id: num(item.id, fallback.id),
            productId,
            productName: text(product?.name, fallback.productName),
            warehouse: text(item.warehouse, fallback.warehouse),
            quantity: num(item.quantity, fallback.quantity),
            minStock: num(item.min_stock, fallback.minStock),
            unit: text(product?.unit, fallback.unit),
          };
        })
      );
    } else {
      setInventory(fallbackInventory);
    }

    if (oeeRes.status === "fulfilled" && oeeRes.value.data) {
      setOee({
        availability: num(oeeRes.value.data.availability, fallbackOee.availability),
        performance: num(oeeRes.value.data.performance, fallbackOee.performance),
        quality: num(oeeRes.value.data.quality, fallbackOee.quality),
        oee: num(oeeRes.value.data.oee, fallbackOee.oee),
        downtime_minutes: num(oeeRes.value.data.downtime_minutes, fallbackOee.downtime_minutes),
        total_target: num(oeeRes.value.data.total_target, fallbackOee.total_target),
        total_produced: num(oeeRes.value.data.total_produced, fallbackOee.total_produced),
      });
    } else {
      setOee(fallbackOee);
    }

    setUsingFallback(anyFailure || rawOrders.length === 0 || rawWorkCenters.length === 0 || rawSchedules.length === 0 || rawInventory.length === 0);
    setLoading(false);
  }

  useEffect(() => {
    loadTerminalData();
  }, []);

  const filteredOrders = useMemo(
    () => (selectedShift === "All" ? orders : orders.filter((order) => order.shift === selectedShift)),
    [orders, selectedShift]
  );

  const metrics = useMemo(() => {
    const ordered = filteredOrders.reduce((sum, item) => sum + item.orderedQty, 0);
    const produced = filteredOrders.reduce((sum, item) => sum + item.producedQty, 0);
    const remaining = Math.max(0, ordered - produced);
    const activeLines = workCenters.filter((line) => line.status.toLowerCase() === "running").length;
    const qaHolds = filteredOrders.filter((item) => item.qaRelease === "Hold").length;
    const shortMaterials = inventory.filter((item) => item.quantity <= item.minStock).length;
    const totalDowntime = downtime.reduce((sum, item) => sum + num(item.duration_minutes), 0);
    const wasteUnits = waste.reduce((sum, item) => sum + num(item.quantity), 0);
    const planAdherence = ordered > 0 ? (produced / ordered) * 100 : 0;

    return {
      ordered,
      produced,
      remaining,
      activeLines,
      qaHolds,
      shortMaterials,
      totalDowntime,
      wasteUnits,
      planAdherence: dashboard?.kpis?.production_efficiency ?? planAdherence,
    };
  }, [dashboard, downtime, filteredOrders, inventory, waste, workCenters]);

  const shortages = useMemo(
    () =>
      inventory
        .filter((item) => item.quantity <= item.minStock)
        .map((item) => ({
          ...item,
          gap: Math.max(0, item.minStock - item.quantity),
          coverage: item.minStock > 0 ? (item.quantity / item.minStock) * 100 : 100,
        })),
    [inventory]
  );

  const managerAlerts: ManagerAlert[] = useMemo(() => {
    const qualityAlerts = quality
      .filter((item) => item.result !== "Pass")
      .map((item) => ({
        title: `${item.result}: ${item.check_type}`,
        message: `Order ${item.production_order_id} has ${item.defects_count} defects. ${item.corrective_action || "QA disposition required before release."}`,
        owner: item.inspector_name,
        tone: item.result === "Fail" ? ("red" as RiskTone) : ("amber" as RiskTone),
      }));

    const downtimeAlerts = downtime.map((item) => ({
      title: item.reason,
      message: `${item.duration_minutes} minutes lost on work center ${item.work_center_id}.`,
      owner: item.recorded_by,
      tone: item.duration_minutes >= 20 ? ("red" as RiskTone) : ("amber" as RiskTone),
    }));

    return [...qualityAlerts, ...downtimeAlerts].slice(0, 6);
  }, [downtime, quality]);

  const riskScore = useMemo(() => {
    let score = 100;
    score -= metrics.qaHolds * 18;
    score -= metrics.shortMaterials * 12;
    score -= Math.min(25, metrics.totalDowntime / 3);
    score -= oee.oee < 65 ? 12 : 0;
    return progress(score);
  }, [metrics, oee]);

  const dispatchReady = useMemo(
    () => filteredOrders.filter((order) => order.remainingQty === 0 && order.qaRelease === "Released").length,
    [filteredOrders]
  );

  const throughputData = workCenters.map((line) => ({
    name: line.name.replace("Packaging ", "Pack "),
    actual: line.speed,
    target: line.targetSpeed,
  }));

  const executionTrend = [
    { hour: "08:00", produced: Math.round(metrics.produced * 0.12), target: Math.round(metrics.ordered * 0.13) },
    { hour: "10:00", produced: Math.round(metrics.produced * 0.28), target: Math.round(metrics.ordered * 0.3) },
    { hour: "12:00", produced: Math.round(metrics.produced * 0.52), target: Math.round(metrics.ordered * 0.52) },
    { hour: "14:00", produced: Math.round(metrics.produced * 0.76), target: Math.round(metrics.ordered * 0.74) },
    { hour: "Now", produced: metrics.produced, target: Math.round(metrics.ordered * 0.82) },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-gray-950">
      <Sidebar />

      <main className="ml-72 min-h-screen p-6">
        <div className="mb-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                {dashboard?.company?.name || "SmartFactory AI"} / Food MES Command Center
              </p>
              <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold">
                <Factory className="text-blue-700" />
                Production Manager Terminal
              </h1>
              <p className="mt-2 max-w-5xl text-sm text-gray-500">
                Live shift execution view for salad and fresh-food production: line status, batches, lots, operators, due times, QA release, material readiness, cold chain, OEE, downtime, waste, and dispatch risk.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="text-gray-500">Shift filter </span>
                <select
                  value={selectedShift}
                  onChange={(event) => setSelectedShift(event.target.value)}
                  className="bg-transparent font-semibold outline-none"
                >
                  <option>All</option>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Night</option>
                </select>
              </div>

              {usingFallback && <Pill tone="amber">Demo data active</Pill>}

              <button
                onClick={loadTerminalData}
                className="flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
              <p className="text-xs font-semibold uppercase">Next dispatch</p>
              <p className="mt-1 text-xl font-bold">14:30 / Lidl Italia</p>
              <p className="text-sm">Mixed Salad 250g, batch BATCH-26-041A</p>
            </div>
            <div className={`rounded-lg border p-3 ${riskScore >= 80 ? toneClass("green") : riskScore >= 60 ? toneClass("amber") : toneClass("red")}`}>
              <p className="text-xs font-semibold uppercase">Shift readiness</p>
              <p className="mt-1 text-xl font-bold">{riskScore.toFixed(0)}%</p>
              <p className="text-sm">Based on QA holds, materials, downtime, and OEE</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
              <p className="text-xs font-semibold uppercase">Dispatch ready</p>
              <p className="mt-1 text-xl font-bold">{dispatchReady} orders</p>
              <p className="text-sm">QA released and fully produced</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800">
              <p className="text-xs font-semibold uppercase">Control point</p>
              <p className="mt-1 text-xl font-bold">Cold chain 2-7 C</p>
              <p className="text-sm">All active lines reporting in range</p>
            </div>
          </div>
        </div>

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard title="Plan Adherence" value={percent(metrics.planAdherence)} subtitle="Produced quantity vs ordered quantity" icon={<Gauge size={20} />} tone={metrics.planAdherence >= 80 ? "green" : "amber"} />
          <KpiCard title="Produced" value={metrics.produced.toLocaleString()} subtitle={`${metrics.ordered.toLocaleString()} ordered units`} icon={<PackageCheck size={20} />} tone="green" />
          <KpiCard title="Remaining" value={metrics.remaining.toLocaleString()} subtitle="Units left before dispatch cutoffs" icon={<Clock3 size={20} />} tone={metrics.remaining > 1000 ? "amber" : "blue"} />
          <KpiCard title="Active Lines" value={`${metrics.activeLines}/${workCenters.length}`} subtitle="Food production work centers online" icon={<Factory size={20} />} tone="purple" />
          <KpiCard title="QA Holds" value={metrics.qaHolds} subtitle="Batches waiting for disposition" icon={<ClipboardCheck size={20} />} tone={metrics.qaHolds > 0 ? "red" : "green"} />
          <KpiCard title="Material Risks" value={metrics.shortMaterials} subtitle="Ingredients or packaging under min" icon={<Warehouse size={20} />} tone={metrics.shortMaterials > 0 ? "red" : "green"} />
        </section>

        <section className="mb-5 grid grid-cols-1 gap-5 2xl:grid-cols-[1.35fr_0.9fr_0.9fr]">
          <Panel title="Live Line Control Board" subtitle="Machine state, batch, operator, speed, sanitation, and cold-chain control points.">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {workCenters.map((line) => {
                const speedPct = line.targetSpeed > 0 ? (line.speed / line.targetSpeed) * 100 : 0;
                const lineTone = statusTone(line.status);

                return (
                  <div key={line.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{line.name}</h3>
                        <p className="text-xs text-gray-500">{line.product}</p>
                      </div>
                      <Pill tone={lineTone}>{line.status}</Pill>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-500">Batch</span>
                      <span className="font-semibold">{line.batch}</span>
                      <span className="text-gray-500">Operator</span>
                      <span className="font-semibold">{line.operator}</span>
                      <span className="text-gray-500">Shift</span>
                      <span className="font-semibold">{line.shift}</span>
                      <span className="text-gray-500">Cold chain</span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Thermometer size={14} />
                        {line.temperature.toFixed(1)} C
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-semibold text-gray-600">Line speed</span>
                        <span>{line.speed} / {line.targetSpeed} units/hr</span>
                      </div>
                      <div className="h-2 rounded-full bg-white">
                        <div
                          className={`h-2 rounded-full ${speedPct >= 90 ? "bg-emerald-600" : speedPct >= 70 ? "bg-blue-600" : "bg-amber-500"}`}
                          style={{ width: `${progress(speedPct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone={line.allergenClean ? "green" : "red"}>{line.allergenClean ? "Allergen clean" : "Allergen hold"}</Pill>
                      <Pill tone={statusTone(line.sanitationStatus)}>Sanitation {line.sanitationStatus}</Pill>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="OEE and Losses" subtitle="Today's operational effectiveness by component.">
            <div className="space-y-4">
              {[
                ["Availability", oee.availability, "bg-emerald-600"],
                ["Performance", oee.performance, "bg-blue-600"],
                ["Quality", oee.quality, "bg-purple-600"],
                ["OEE Score", oee.oee, "bg-gray-950"],
              ].map(([label, value, color]) => (
                <div key={String(label)}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="font-bold">{percent(Number(value))}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${progress(Number(value))}%` }} />
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Downtime</p>
                  <p className="text-xl font-bold">{metrics.totalDowntime} min</p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Waste</p>
                  <p className="text-xl font-bold">{metrics.wasteUnits} units</p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="AI Shift Commander" subtitle="Prioritized actions for the production manager.">
            <div className="space-y-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
                <h3 className="flex items-center gap-2 font-bold">
                  <Lightbulb size={18} />
                  Run the critical path first
                </h3>
                <p className="mt-2 text-sm">
                  Move {orders.find((item) => item.priority === "Urgent")?.orderNumber || "the urgent order"} to the front of the night shift once lettuce and QA release are confirmed.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                <h3 className="flex items-center gap-2 font-bold">
                  <Timer size={18} />
                  Protect dispatch windows
                </h3>
                <p className="mt-2 text-sm">
                  Keep packaging changeovers inside planned breaks. Packaging Line B is the current dispatch risk because sanitation is due.
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <h3 className="flex items-center gap-2 font-bold">
                  <ClipboardCheck size={18} />
                  Tighten QA sampling
                </h3>
                <p className="mt-2 text-sm">
                  Increase seal inspection sampling to every 15 minutes until defects fall below the internal control limit.
                </p>
              </div>
            </div>
          </Panel>
        </section>

        <section className="mb-5 grid grid-cols-1 gap-5 2xl:grid-cols-[1.25fr_0.75fr]">
          <Panel
            title="Today's Scheduled Orders"
            subtitle="Batch execution by customer, line, operator, due time, produced quantity, and remaining quantity."
            action={<Pill tone="blue">{filteredOrders.length} active orders</Pill>}
          >
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-3">Order / Batch</th>
                    <th className="px-3 py-3">Product / Lot</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Line</th>
                    <th className="px-3 py-3">Operator</th>
                    <th className="px-3 py-3">Shift</th>
                    <th className="px-3 py-3">Due</th>
                    <th className="px-3 py-3">Execution</th>
                    <th className="px-3 py-3">QA</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.map((order) => {
                    const completion = order.orderedQty > 0 ? (order.producedQty / order.orderedQty) * 100 : 0;

                    return (
                      <tr key={order.id} className="bg-white align-top">
                        <td className="px-3 py-3 font-semibold">
                          {order.orderNumber}
                          <p className="text-xs font-normal text-gray-500">{order.batch}</p>
                        </td>
                        <td className="px-3 py-3">
                          {order.productName}
                          <p className="text-xs text-gray-500">{order.lot}</p>
                        </td>
                        <td className="px-3 py-3">{order.customer}</td>
                        <td className="px-3 py-3">{order.line}</td>
                        <td className="px-3 py-3">{order.operator}</td>
                        <td className="px-3 py-3">{order.shift}</td>
                        <td className="px-3 py-3 font-bold">{order.dueTime}</td>
                        <td className="px-3 py-3">
                          <div className="min-w-36">
                            <div className="mb-1 flex justify-between text-xs">
                              <span>{order.producedQty} / {order.orderedQty}</span>
                              <span>{order.remainingQty} left</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100">
                              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress(completion)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Pill tone={statusTone(order.qaRelease)}>{order.qaRelease}</Pill>
                        </td>
                        <td className="px-3 py-3">
                          <Pill tone={statusTone(order.status)}>{order.status}</Pill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Alerts and Holds" subtitle="Downtime, quality, and line events requiring action.">
            <div className="space-y-3">
              {managerAlerts.map((alert, index) => (
                <div key={`${alert.title}-${index}`} className={`rounded-lg border p-3 ${toneClass(alert.tone)}`}>
                  <div className="flex items-start gap-2">
                    {alert.tone === "red" ? <ShieldAlert size={17} /> : <AlertTriangle size={17} />}
                    <div>
                      <p className="font-semibold">{alert.title}</p>
                      <p className="mt-1 text-sm">{alert.message}</p>
                      <p className="mt-2 text-xs font-semibold">Owner: {alert.owner}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mb-5 grid grid-cols-1 gap-5 2xl:grid-cols-3">
          <Panel title="Throughput by Line" subtitle="Actual speed versus target speed.">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={throughputData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="target" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="actual" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Production Trend" subtitle="Produced quantity versus target trajectory.">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={executionTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area dataKey="target" type="monotone" stroke="#94a3b8" fill="#e2e8f0" strokeWidth={2} />
                  <Area dataKey="produced" type="monotone" stroke="#16a34a" fill="#bbf7d0" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Material Shortage Control" subtitle="Ingredients and packaging materials below minimum stock.">
            <div className="space-y-3">
              {shortages.map((item) => (
                <div key={item.id} className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <PackageSearch size={17} />
                      <div>
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-sm">{item.warehouse}</p>
                      </div>
                    </div>
                    <Pill tone="red">Gap {item.gap} {item.unit}</Pill>
                  </div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{item.quantity} {item.unit} on hand</span>
                    <span>Min {item.minStock}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white">
                    <div className="h-2 rounded-full bg-red-600" style={{ width: `${progress(item.coverage)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <Panel
          title="Schedule Readiness Snapshot"
          subtitle="Material status, conflicts, assigned operators, and capacity load for today's scheduled batches."
          action={<Pill tone="slate">{schedules.length} schedule blocks</Pill>}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">Order {schedule.order_id || schedule.id}</p>
                    <p className="text-sm text-gray-500">{schedule.shift} shift / {schedule.start_time} - {schedule.end_time}</p>
                  </div>
                  <Pill tone={statusTone(schedule.priority)}>{schedule.priority}</Pill>
                </div>
                <div className="mb-3 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress(num(schedule.capacity_load))}%` }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill tone={statusTone(schedule.status)}>{schedule.status}</Pill>
                  <Pill tone={statusTone(schedule.material_status || "Unchecked")}>Material {schedule.material_status || "Unchecked"}</Pill>
                  <Pill tone={statusTone(schedule.conflict_status || "Clear")}>{schedule.conflict_status || "Clear"}</Pill>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <UserRound size={15} />
                  {schedule.assigned_operator || "Operator not assigned"}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold">
              <Truck size={18} className="text-blue-700" />
              Dispatch Handoff
            </h3>
            <p className="mt-2 text-sm text-gray-600">Confirm finished-good labels, lot traceability, and QA release before truck loading.</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold">
              <CalendarClock size={18} className="text-amber-700" />
              Shift Handoff
            </h3>
            <p className="mt-2 text-sm text-gray-600">Brief next shift on remaining quantity, material shortages, sanitation due, and active QA holds.</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold">
              <ArrowUpRight size={18} className="text-emerald-700" />
              Manager Decision
            </h3>
            <p className="mt-2 text-sm text-gray-600">Approve reallocation to Packaging Line A if Line B sanitation is not verified before 13:30.</p>
          </div>
        </div>

        {loading && (
          <div className="fixed bottom-5 right-5 rounded-lg border bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-lg">
            Loading production terminal...
          </div>
        )}
      </main>
    </div>
  );
}
