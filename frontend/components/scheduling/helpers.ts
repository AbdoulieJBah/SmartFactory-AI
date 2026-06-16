import { AnyRecord } from "./types";

export function safeArray(value: any): AnyRecord[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

export function getValue(
  obj: AnyRecord,
  keys: string[],
  fallback: string | number = "-"
) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== "") {
      return obj[key];
    }
  }

  return fallback;
}

export function priorityClass(priority: string) {
  if (priority === "Urgent") return "bg-red-100 text-red-700";
  if (priority === "High") return "bg-orange-100 text-orange-700";
  return "bg-blue-100 text-blue-700";
}

export function statusClass(status: string) {
  if (status === "Completed") return "bg-emerald-100 text-emerald-700";
  if (status === "In Progress") return "bg-blue-100 text-blue-700";
  if (status === "Released") return "bg-purple-100 text-purple-700";
  if (status === "Delayed") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

export function riskClass(risk: string) {
  if (risk === "High") return "bg-red-100 text-red-700";
  if (risk === "Medium") return "bg-orange-100 text-orange-700";
  return "bg-emerald-100 text-emerald-700";
}

export function materialClass(status?: string | null) {
  if (status === "Available") return "bg-emerald-100 text-emerald-700";
  if (status === "Insufficient" || status === "No Inventory")
    return "bg-red-100 text-red-700";
  return "bg-orange-100 text-orange-700";
}

export function conflictClass(status?: string | null) {
  if (status === "Conflict") return "bg-red-100 text-red-700";
  return "bg-emerald-100 text-emerald-700";
}