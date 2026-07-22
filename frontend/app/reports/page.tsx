"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import {
  FileText,
  Package,
  Factory,
  Wallet,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";

interface ExecutiveReport {
  summary: {
    products: number;
    inventory_value: number;
    production_orders: number;
    sales_value: number;
    purchase_value: number;
    waste_units: number;
    downtime_minutes: number;
    quality_checks: number;
    failed_checks: number;
  };
}

function ReportCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>

        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
          <Icon size={22} />
        </div>
      </div>

      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState("");

  const fetchReport = async () => {
    try {
      setError("");
      const res = await api.get("/reports/executive");
      setReport(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const downloadFile = async (
    endpoint: string,
    filename: string,
    type: "pdf" | "excel"
  ) => {
    try {
      setDownloading(filename);
      setError("");

      const response = await api.get(endpoint, {
        responseType: "blob",
      });

      const mimeType =
        type === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const blob = new Blob([response.data], {
        type: mimeType,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloading("");
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const s = report?.summary;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="ml-72 min-h-screen flex-1 overflow-x-auto p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <FileText className="text-blue-600" />
              Reports
            </h1>

            <p className="text-gray-500 mt-2">
              Executive reporting for production, inventory, finance, quality,
              and operations.
            </p>
          </div>

          <button
            onClick={() =>
              downloadFile(
                "/pdf-reports/executive",
                "smartfactory_executive_report.pdf",
                "pdf"
              )
            }
            disabled={downloading !== ""}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap"
          >
            <Download size={18} />
            {downloading === "smartfactory_executive_report.pdf"
              ? "Downloading..."
              : "Download PDF"}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {!report ? (
          <div className="bg-white rounded-xl border p-8 text-gray-500">
            Loading executive report...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <ReportCard
                title="Products"
                value={s?.products ?? 0}
                subtitle="Total registered products"
                icon={Package}
              />

              <ReportCard
                title="Inventory Value"
                value={`€${s?.inventory_value ?? 0}`}
                subtitle="Estimated stock value"
                icon={Wallet}
              />

              <ReportCard
                title="Production Orders"
                value={s?.production_orders ?? 0}
                subtitle="Total production orders"
                icon={Factory}
              />

              <ReportCard
                title="Sales Value"
                value={`€${s?.sales_value ?? 0}`}
                subtitle="Total sales order value"
                icon={Wallet}
              />

              <ReportCard
                title="Purchase Value"
                value={`€${s?.purchase_value ?? 0}`}
                subtitle="Total purchasing value"
                icon={Wallet}
              />

              <ReportCard
                title="Waste Units"
                value={s?.waste_units ?? 0}
                subtitle="Recorded waste quantity"
                icon={AlertTriangle}
              />

              <ReportCard
                title="Downtime"
                value={`${s?.downtime_minutes ?? 0} min`}
                subtitle="Total recorded downtime"
                icon={Clock}
              />

              <ReportCard
                title="Quality Failures"
                value={`${s?.failed_checks ?? 0}/${s?.quality_checks ?? 0}`}
                subtitle="Failed checks over total checks"
                icon={ClipboardCheck}
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Executive Summary</h2>

              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  SmartFactory AI currently tracks{" "}
                  <strong>{s?.products}</strong> products, with an estimated
                  inventory value of{" "}
                  <strong>€{s?.inventory_value}</strong>.
                </p>

                <p>
                  Sales order value is <strong>€{s?.sales_value}</strong>, while
                  purchase order value is{" "}
                  <strong>€{s?.purchase_value}</strong>.
                </p>

                <p>
                  Operations recorded <strong>{s?.waste_units}</strong> units of
                  waste and <strong>{s?.downtime_minutes}</strong> minutes of
                  downtime.
                </p>

                <p>
                  Quality checks completed:{" "}
                  <strong>{s?.quality_checks}</strong>. Failed quality checks:{" "}
                  <strong>{s?.failed_checks}</strong>.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <FileSpreadsheet className="text-green-600" />
                Excel Exports
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Download operational data as Excel files for analysis,
                reporting, and sharing.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() =>
                    downloadFile(
                      "/excel/inventory",
                      "inventory.xlsx",
                      "excel"
                    )
                  }
                  disabled={downloading !== ""}
                  className="border rounded-xl p-5 text-left hover:bg-gray-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="text-green-600 mb-3" />
                  <h3 className="font-semibold">Inventory</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Stock levels and warehouses
                  </p>
                </button>

                <button
                  onClick={() =>
                    downloadFile(
                      "/excel/production-orders",
                      "production_orders.xlsx",
                      "excel"
                    )
                  }
                  disabled={downloading !== ""}
                  className="border rounded-xl p-5 text-left hover:bg-gray-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="text-green-600 mb-3" />
                  <h3 className="font-semibold">Production Orders</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Targets, output, and status
                  </p>
                </button>

                <button
                  onClick={() =>
                    downloadFile(
                      "/excel/quality-checks",
                      "quality_checks.xlsx",
                      "excel"
                    )
                  }
                  disabled={downloading !== ""}
                  className="border rounded-xl p-5 text-left hover:bg-gray-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="text-green-600 mb-3" />
                  <h3 className="font-semibold">Quality Checks</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Inspection results and defects
                  </p>
                </button>

                <button
                  onClick={() =>
                    downloadFile(
                      "/excel/oee",
                      "oee_report.xlsx",
                      "excel"
                    )
                  }
                  disabled={downloading !== ""}
                  className="border rounded-xl p-5 text-left hover:bg-gray-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="text-green-600 mb-3" />
                  <h3 className="font-semibold">OEE Report</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Availability, performance, quality
                  </p>
                </button>
              </div>

              {downloading && (
                <p className="text-sm text-blue-600 mt-4">
                  Downloading {downloading}...
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
