"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import {
  AlertTriangle,
  Boxes,
  Factory,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

type AnyRecord = Record<string, unknown>;
type ApiCollection = {
  data?: unknown;
  items?: unknown;
  results?: unknown;
};

function safeArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value;
  const collection = value && typeof value === "object" ? (value as ApiCollection) : {};
  if (Array.isArray(collection.data)) return collection.data as AnyRecord[];
  if (Array.isArray(collection.items)) return collection.items as AnyRecord[];
  if (Array.isArray(collection.results)) return collection.results as AnyRecord[];
  return [];
}

function getValue(obj: AnyRecord, keys: string[], fallback: string | number = "-"): string | number {
  for (const key of keys) {
    const value = obj?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return typeof value === "number" || typeof value === "string"
        ? value
        : String(value);
    }
  }
  return fallback;
}

function statusClass(status: string) {
  const s = status.toLowerCase();

  if (s.includes("active")) return "bg-emerald-100 text-emerald-700";
  if (s.includes("consumed")) return "bg-blue-100 text-blue-700";
  if (s.includes("expired")) return "bg-orange-100 text-orange-700";
  if (s.includes("recalled")) return "bg-red-100 text-red-700";

  return "bg-gray-100 text-gray-700";
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-950">{value}</h2>
        </div>
        <div className="rounded-xl bg-blue-50 p-2 text-blue-700">{icon}</div>
      </div>
      <p className="mt-3 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

const traceabilityFlow: [string, LucideIcon][] = [
  ["Supplier", Truck],
  ["Raw Batch", Boxes],
  ["Production Batch", Factory],
  ["Finished Product", PackageCheck],
  ["Customer / Recall", ShieldCheck],
];

export default function TraceabilityPage() {
  const [batches, setBatches] = useState<AnyRecord[]>([]);
  const [products, setProducts] = useState<AnyRecord[]>([]);
  const [suppliers, setSuppliers] = useState<AnyRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [traceRes, productRes, supplierRes] = await Promise.allSettled([
        api.get("/traceability/"),
        api.get("/products/"),
        api.get("/suppliers/"),
      ]);

      if (traceRes.status === "fulfilled") setBatches(safeArray(traceRes.value.data));
      if (productRes.status === "fulfilled") setProducts(safeArray(productRes.value.data));
      if (supplierRes.status === "fulfilled") setSuppliers(safeArray(supplierRes.value.data));

      if (traceRes.status === "rejected") setError(getErrorMessage(traceRes.reason));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const getProductName = useCallback((id: string | number) => {
    const product = products.find((p) => String(getValue(p, ["id"], "")) === String(id));
    return String(getValue(product || {}, ["name", "product_name", "sku"], `Product ${id}`));
  }, [products]);

  const getSupplierName = useCallback((id: string | number) => {
    const supplier = suppliers.find((s) => String(getValue(s, ["id"], "")) === String(id));
    return String(getValue(supplier || {}, ["name", "supplier_name"], id ? `Supplier ${id}` : "No supplier"));
  }, [suppliers]);

  const filteredBatches = useMemo(() => {
    const q = query.toLowerCase();

    return batches.filter((batch) => {
      const batchNumber = String(getValue(batch, ["batch_number", "batchNumber"], "")).toLowerCase();
      const productName = getProductName(getValue(batch, ["product_id", "productId"], "")).toLowerCase();
      const supplierName = getSupplierName(getValue(batch, ["supplier_id", "supplierId"], "")).toLowerCase();
      const status = String(getValue(batch, ["status"], "")).toLowerCase();

      return (
        !q ||
        batchNumber.includes(q) ||
        productName.includes(q) ||
        supplierName.includes(q) ||
        status.includes(q)
      );
    });
  }, [batches, getProductName, getSupplierName, query]);

  const activeCount = batches.filter(
    (b) => String(getValue(b, ["status"], "")).toLowerCase() === "active"
  ).length;

  const recalledCount = batches.filter(
    (b) => String(getValue(b, ["status"], "")).toLowerCase() === "recalled"
  ).length;

  const totalQuantity = batches.reduce(
    (sum, b) => sum + Number(getValue(b, ["quantity"], 0)),
    0
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="ml-72 min-h-screen p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">SmartFactory AI</p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold text-gray-950">
              <ShieldCheck className="text-blue-700" />
              Food Traceability Command Center
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track supplier batches, raw materials, production lots, finished products, and recall risk.
            </p>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <KpiCard title="Total Batches" value={batches.length} subtitle="All traceability records" icon={<Boxes size={18} />} />
          <KpiCard title="Active Batches" value={activeCount} subtitle="Available for production" icon={<PackageCheck size={18} />} />
          <KpiCard title="Total Quantity" value={totalQuantity} subtitle="Tracked units or kg" icon={<Factory size={18} />} />
          <KpiCard title="Recall Risk" value={recalledCount} subtitle="Recalled batches" icon={<AlertTriangle size={18} />} />
        </section>

        <section className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search batch, product, supplier, or status..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </section>

        <section className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-950">
            Farm-to-Customer Traceability Flow
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {traceabilityFlow.map(([label, Icon], index) => (
              <div key={label} className="rounded-xl border bg-gray-50 p-4 text-center">
                <Icon className="mx-auto mb-2 text-blue-700" size={24} />
                <p className="font-semibold text-gray-950">{label}</p>
                {index < 4 && <p className="mt-1 text-xs text-gray-500">Linked chain</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-950">Batch Traceability Records</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading traceability records...</p>
          ) : filteredBatches.length === 0 ? (
            <p className="text-sm text-gray-500">No traceability records found.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Recall Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredBatches.map((batch, index) => {
                    const status = String(getValue(batch, ["status"], "Active"));
                    const productId = getValue(batch, ["product_id", "productId"], "");
                    const supplierId = getValue(batch, ["supplier_id", "supplierId"], "");

                    return (
                      <tr key={index} className="bg-white">
                        <td className="px-4 py-3 font-semibold text-gray-950">
                          {getValue(batch, ["batch_number", "batchNumber"], "-")}
                        </td>
                        <td className="px-4 py-3">{getProductName(productId)}</td>
                        <td className="px-4 py-3">{getSupplierName(supplierId)}</td>
                        <td className="px-4 py-3">{getValue(batch, ["quantity"], 0)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            Trace Chain
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
