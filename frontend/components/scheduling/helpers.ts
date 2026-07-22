import { AnyRecord } from "./types";

type ApiCollection = {
  data?: unknown;
  items?: unknown;
  results?: unknown;
};

function asCollection(value: unknown): ApiCollection {
  return value && typeof value === "object" ? (value as ApiCollection) : {};
}

export function safeArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value;
  const collection = asCollection(value);
  if (Array.isArray(collection.data)) return collection.data as AnyRecord[];
  if (Array.isArray(collection.items)) return collection.items as AnyRecord[];
  if (Array.isArray(collection.results)) return collection.results as AnyRecord[];
  return [];
}

export function getValue(
  obj: AnyRecord,
  keys: string[],
  fallback: string | number = "-"
): string | number {
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

export function priorityClass(priority: string) {
  if (priority === "Urgent")
    return "bg-red-100 text-red-700";

  if (priority === "High")
    return "bg-orange-100 text-orange-700";

  return "bg-blue-100 text-blue-700";
}

export function statusClass(status: string) {
  if (status === "Completed")
    return "bg-emerald-100 text-emerald-700";

  if (status === "In Progress")
    return "bg-blue-100 text-blue-700";

  if (status === "Released")
    return "bg-purple-100 text-purple-700";

  if (status === "Delayed")
    return "bg-red-100 text-red-700";

  return "bg-gray-100 text-gray-700";
}

export function materialClass(status?: string) {
  if (
    status === "Insufficient" ||
    status === "No Inventory"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (status === "Available") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-gray-100 text-gray-700";
}

export function conflictClass(status?: string) {
  if (status === "Conflict") {
    return "bg-red-100 text-red-700";
  }

  return "bg-emerald-100 text-emerald-700";
}
