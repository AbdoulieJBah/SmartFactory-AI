"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getErrorMessage } from "../app/lib/api";
import Sidebar from "./Sidebar";

type FieldType = "text" | "number" | "select";

export interface FieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: string[];
  defaultValue?: string;

  apiEndpoint?: string;
  labelField?: string;
  valueField?: string;
}

interface CrudPageProps {
  title: string;
  subtitle: string;
  endpoint: string;
  fields: FieldConfig[];
  columns: {
    key: string;
    label: string;
    badge?: boolean;
  }[];
}

type RowData = Record<string, unknown>;

export default function CrudPage({
  title,
  subtitle,
  endpoint,
  fields,
  columns,
}: CrudPageProps) {
  const initialForm = useMemo(() => {
    return fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = field.defaultValue ?? "";
      return acc;
    }, {});
  }, [fields]);

  const [rows, setRows] = useState<RowData[]>([]);
  const [lookupData, setLookupData] = useState<Record<string, RowData[]>>({});
  const [form, setForm] = useState<Record<string, string>>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(endpoint);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const fetchLookups = useCallback(async () => {
    const data: Record<string, RowData[]> = {};

    for (const field of fields) {
      if (field.apiEndpoint) {
        try {
          const response = await api.get(field.apiEndpoint);
          data[field.name] = Array.isArray(response.data) ? response.data : [];
        } catch {
          data[field.name] = [];
        }
      }
    }

    setLookupData(data);
  }, [fields]);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  useEffect(() => {
    fetchRows();
    fetchLookups();
  }, [fetchLookups, fetchRows]);

  const buildPayload = () => {
    const payload: RowData = {};

    fields.forEach((field) => {
      const value = form[field.name];

      if (field.type === "number" || field.apiEndpoint) {
        payload[field.name] = value === "" ? null : Number(value);
      } else {
        payload[field.name] = value;
      }
    });

    return payload;
  };

  const validateForm = () => {
    for (const field of fields) {
      if (field.required && !form[field.name]) {
        alert(`${field.label} is required`);
        return false;
      }
    }

    return true;
  };

  const saveRow = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError("");

      const payload = buildPayload();

      if (editingId) {
        await api.put(`${endpoint}${editingId}`, payload);
      } else {
        await api.post(endpoint, payload);
      }

      setForm(initialForm);
      setEditingId(null);
      await fetchRows();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row: RowData) => {
    const nextForm = { ...initialForm };

    fields.forEach((field) => {
      nextForm[field.name] =
        row[field.name] === null || row[field.name] === undefined
          ? ""
          : String(row[field.name]);
    });

    setForm(nextForm);
    setEditingId(Number(row.id));
  };

  const deleteRow = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      setError("");
      await api.delete(`${endpoint}${id}`);
      await fetchRows();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const cancelEdit = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const getLookupLabel = (fieldName: string, value: unknown) => {
    const field = fields.find((item) => item.name === fieldName);

    if (!field?.apiEndpoint) return value ?? "-";

    const items = lookupData[fieldName] || [];
    const valueKey = field.valueField || "id";
    const labelKey = field.labelField || "name";

    const matched = items.find(
      (item) => String(item[valueKey]) === String(value)
    );

    return matched ? matched[labelKey] : value ?? "-";
  };

  const renderValue = (row: RowData, key: string, badge?: boolean) => {
    const rawValue = row[key] ?? "-";
    const displayValue = getLookupLabel(key, rawValue);

    if (!badge) return String(displayValue);

    const text = String(displayValue);
    const lower = text.toLowerCase();

    let className = "bg-gray-100 text-gray-700";

    if (
      lower.includes("active") ||
      lower.includes("running") ||
      lower.includes("completed") ||
      lower.includes("pass") ||
      lower.includes("received") ||
      lower.includes("delivered") ||
      lower.includes("confirmed")
    ) {
      className = "bg-green-100 text-green-700";
    }

    if (
      lower.includes("pending") ||
      lower.includes("planned") ||
      lower.includes("warning") ||
      lower.includes("idle") ||
      lower.includes("released") ||
      lower.includes("ordered")
    ) {
      className = "bg-yellow-100 text-yellow-700";
    }

    if (
      lower.includes("fail") ||
      lower.includes("stopped") ||
      lower.includes("cancelled") ||
      lower.includes("maintenance") ||
      lower.includes("urgent")
    ) {
      className = "bg-red-100 text-red-700";
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}
      >
        {text}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="ml-72 min-h-screen flex-1 overflow-x-auto p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-gray-500 mt-1">{subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Record" : "Create New Record"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm text-gray-600 mb-1">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>

                {field.type === "select" && field.apiEndpoint ? (
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={form[field.name] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.name]: e.target.value,
                      })
                    }
                  >
                    <option value="">Select {field.label}</option>

                    {(lookupData[field.name] || []).map((item) => {
                      const valueKey = field.valueField || "id";
                      const labelKey = field.labelField || "name";

                      const optionValue = String(item[valueKey] ?? "");
                      const optionLabel = String(item[labelKey] ?? optionValue);

                      return (
                        <option key={optionValue} value={optionValue}>
                          {optionLabel}
                        </option>
                      );
                    })}
                  </select>
                ) : field.type === "select" ? (
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={form[field.name] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.name]: e.target.value,
                      })
                    }
                  >
                    {field.options?.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2"
                    type={field.type === "number" ? "number" : "text"}
                    value={form[field.name] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.name]: e.target.value,
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={saveRow}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2 rounded-lg"
            >
              {saving ? "Saving..." : editingId ? "Update Record" : "Create Record"}
            </button>

            {editingId && (
              <button
                onClick={cancelEdit}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-gray-500">Loading records...</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-gray-500">No records found.</div>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="p-3 text-left text-sm font-semibold text-gray-600"
                    >
                      {column.label}
                    </th>
                  ))}

                  <th className="p-3 text-left text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const rowId = Number(row.id);

                  return (
                  <tr key={rowId} className="border-b hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column.key} className="p-3 text-sm">
                        {renderValue(row, column.key, column.badge)}
                      </td>
                    ))}

                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => editRow(row)}
                        className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteRow(rowId)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
