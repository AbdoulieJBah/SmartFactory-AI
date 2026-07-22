// frontend/services/api.ts

import { api } from "../app/lib/api";

type ApiPayload = Record<string, unknown>;

export const productApi = {
  getAll: () => api.get("/products/"),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: ApiPayload) => api.post("/products/", data),
  update: (id: number, data: ApiPayload) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const inventoryApi = {
  getAll: () => api.get("/inventory/"),
  getById: (id: number) => api.get(`/inventory/${id}`),
  create: (data: ApiPayload) => api.post("/inventory/", data),
  update: (id: number, data: ApiPayload) => api.put(`/inventory/${id}`, data),
  delete: (id: number) => api.delete(`/inventory/${id}`),
};

export const supplierApi = {
  getAll: () => api.get("/suppliers/"),
  getById: (id: number) => api.get(`/suppliers/${id}`),
  create: (data: ApiPayload) => api.post("/suppliers/", data),
  update: (id: number, data: ApiPayload) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

export const customerApi = {
  getAll: () => api.get("/customers/"),
  getById: (id: number) => api.get(`/customers/${id}`),
  create: (data: ApiPayload) => api.post("/customers/", data),
  update: (id: number, data: ApiPayload) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

export const productionOrderApi = {
  getAll: () => api.get("/production-orders/"),
  getById: (id: number) => api.get(`/production-orders/${id}`),
  create: (data: ApiPayload) => api.post("/production-orders/", data),
  update: (id: number, data: ApiPayload) =>
    api.put(`/production-orders/${id}`, data),
  delete: (id: number) => api.delete(`/production-orders/${id}`),
};

export const purchaseOrderApi = {
  getAll: () => api.get("/purchase-orders/"),
  getById: (id: number) => api.get(`/purchase-orders/${id}`),
  create: (data: ApiPayload) => api.post("/purchase-orders/", data),
  update: (id: number, data: ApiPayload) =>
    api.put(`/purchase-orders/${id}`, data),
  delete: (id: number) => api.delete(`/purchase-orders/${id}`),
};

export const salesOrderApi = {
  getAll: () => api.get("/sales-orders/"),
  getById: (id: number) => api.get(`/sales-orders/${id}`),
  create: (data: ApiPayload) => api.post("/sales-orders/", data),
  update: (id: number, data: ApiPayload) =>
    api.put(`/sales-orders/${id}`, data),
  delete: (id: number) => api.delete(`/sales-orders/${id}`),
};

export const qualityCheckApi = {
  getAll: () => api.get("/quality-checks/"),
  getById: (id: number) => api.get(`/quality-checks/${id}`),
  create: (data: ApiPayload) => api.post("/quality-checks/", data),
  update: (id: number, data: ApiPayload) => api.put(`/quality-checks/${id}`, data),
  delete: (id: number) => api.delete(`/quality-checks/${id}`),
};

export const wasteApi = {
  getAll: () => api.get("/waste-records/"),
  getById: (id: number) => api.get(`/waste-records/${id}`),
  create: (data: ApiPayload) => api.post("/waste-records/", data),
  update: (id: number, data: ApiPayload) => api.put(`/waste-records/${id}`, data),
  delete: (id: number) => api.delete(`/waste-records/${id}`),
};

export const downtimeApi = {
  getAll: () => api.get("/downtime/"),
  getById: (id: number) => api.get(`/downtime/${id}`),
  create: (data: ApiPayload) => api.post("/downtime/", data),
  update: (id: number, data: ApiPayload) => api.put(`/downtime/${id}`, data),
  delete: (id: number) => api.delete(`/downtime/${id}`),
};

export const maintenanceApi = {
  getAll: () => api.get("/maintenance/"),
  getById: (id: number) => api.get(`/maintenance/${id}`),
  create: (data: ApiPayload) => api.post("/maintenance/", data),
  update: (id: number, data: ApiPayload) => api.put(`/maintenance/${id}`, data),
  delete: (id: number) => api.delete(`/maintenance/${id}`),
};

export const traceabilityApi = {
  getAll: () => api.get("/traceability/"),
  getById: (id: number) => api.get(`/traceability/${id}`),
  create: (data: ApiPayload) => api.post("/traceability/", data),
  update: (id: number, data: ApiPayload) =>
    api.put(`/traceability/${id}`, data),
  delete: (id: number) => api.delete(`/traceability/${id}`),
};

export const dashboardApi = {
  getExecutive: () => api.get("/dashboard/"),
};

export const aiApi = {
  ask: (question: string) => api.post("/ai/ask", { question }),
};

export const reportsApi = {
  getExecutive: () => api.get("/reports/executive"),
};

export const alertsApi = {
  getAll: () => api.get("/alerts/"),
};

export const usersApi = {
  getAll: () => api.get("/users/"),
  getMe: () => api.get("/users/me"),
};

export const companiesApi = {
  getAll: () => api.get("/companies/"),
  create: (data: ApiPayload) => api.post("/companies/", data),
};

export const auditLogsApi = {
  getAll: () => api.get("/audit-logs/"),
};

export default api;
