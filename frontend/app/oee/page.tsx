"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";
import {
  Gauge,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface OEEData {
  company: {
    id: number;
    name: string;
  };
  planned_minutes: number;
  runtime_minutes: number;
  downtime_minutes: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  total_target: number;
  total_produced: number;
  total_quality_checks: number;
  failed_quality_checks: number;
  loss_reasons: {
    area: string;
    issue: string;
    recommendation: string;
  }[];
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h2 className="text-3xl font-bold mt-2">{value}</h2>
        </div>

        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

export default function OEEPage() {
  const [oeeData, setOeeData] = useState<OEEData | null>(null);
  const [error, setError] = useState("");

  const fetchOEE = async () => {
    try {
      setError("");

      const response = await api.get("/oee/");

      setOeeData(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchOEE();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 overflow-x-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Gauge className="text-blue-600" />
            OEE Dashboard
          </h1>

          <p className="text-gray-500 mt-2">
            Overall Equipment Effectiveness monitoring
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {!oeeData ? (
          <div className="bg-white rounded-xl border p-8">
            Loading OEE metrics...
          </div>
        ) : (
          <>
            <div className="mb-8 bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-semibold">
                {oeeData.company.name}
              </h2>

              <p className="text-gray-500 mt-1">
                Overall Equipment Effectiveness Overview
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="OEE"
                value={`${oeeData.oee}%`}
                icon={Gauge}
              />

              <MetricCard
                title="Availability"
                value={`${oeeData.availability}%`}
                icon={Clock}
              />

              <MetricCard
                title="Performance"
                value={`${oeeData.performance}%`}
                icon={TrendingUp}
              />

              <MetricCard
                title="Quality"
                value={`${oeeData.quality}%`}
                icon={CheckCircle}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Production Summary
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Planned Minutes</span>
                    <strong>{oeeData.planned_minutes}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Runtime Minutes</span>
                    <strong>{oeeData.runtime_minutes}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Downtime Minutes</span>
                    <strong>{oeeData.downtime_minutes}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Target Quantity</span>
                    <strong>{oeeData.total_target}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Produced Quantity</span>
                    <strong>{oeeData.total_produced}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Quality Summary
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Quality Checks</span>
                    <strong>{oeeData.total_quality_checks}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Failed Checks</span>
                    <strong>{oeeData.failed_quality_checks}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Quality Score</span>
                    <strong>{oeeData.quality}%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <AlertTriangle className="text-orange-500" />
                OEE Loss Analysis
              </h2>

              <div className="space-y-4">
                {oeeData.loss_reasons.map((loss, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <h3 className="font-semibold text-lg">
                      {loss.area}
                    </h3>

                    <p className="text-red-600 mt-2">
                      {loss.issue}
                    </p>

                    <p className="text-green-700 mt-2">
                      Recommendation: {loss.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}