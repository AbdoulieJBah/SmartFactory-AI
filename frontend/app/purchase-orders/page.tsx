"use client";

import CrudPage from "../../components/CrudPage";

export default function PurchaseOrdersPage() {
  return (
    <CrudPage
      title="Purchase Orders"
      subtitle="Create and manage supplier purchase orders."
      endpoint="/purchase-orders/"
      fields={[
        {
          name: "supplier_id",
          label: "Supplier",
          type: "select",
          required: true,
          apiEndpoint: "/suppliers/",
          labelField: "name",
          valueField: "id",
        },
        {
          name: "product_id",
          label: "Product",
          type: "select",
          required: true,
          apiEndpoint: "/products/",
          labelField: "name",
          valueField: "id",
        },
        { name: "quantity", label: "Quantity", type: "number", required: true },
        { name: "unit_price", label: "Unit Price", type: "number", defaultValue: "0" },
        {
          name: "status",
          label: "Status",
          type: "select",
          defaultValue: "Pending",
          options: ["Pending", "Ordered", "Received", "Cancelled"],
        },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "supplier_id", label: "Supplier" },
        { key: "product_id", label: "Product" },
        { key: "quantity", label: "Quantity" },
        { key: "unit_price", label: "Unit Price" },
        { key: "status", label: "Status", badge: true },
      ]}
    />
  );
}