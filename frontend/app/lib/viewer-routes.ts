// These pages render read-only information or use the permission-aware CRUD table.
// API authorization remains the security boundary.
export const viewerRoutes = new Set([
  "/", "/reports", "/alerts", "/notifications", "/forecasting", "/oee",
  "/products", "/inventory", "/production-orders", "/work-centers",
  "/maintenance", "/quality", "/downtime", "/waste", "/suppliers",
  "/customers", "/purchase-orders", "/sales-orders",
]);
