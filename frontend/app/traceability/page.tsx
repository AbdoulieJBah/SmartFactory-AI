"use client";

import CrudPage from "../../components/CrudPage";

export default function TraceabilityPage() {
  return (
    <CrudPage
      title="Traceability"
      subtitle="Track batches, lots, suppliers, and product movement."
      endpoint="/traceability/"
      fields={[
        { name: "batch_number", label: "Batch Number", required: true },
        {
          name: "product_id",
          label: "Product",
          type: "select",
          required: true,
          apiEndpoint: "/products/",
          labelField: "name",
          valueField: "id",
        },
        {
          name: "supplier_id",
          label: "Supplier",
          type: "select",
          apiEndpoint: "/suppliers/",
          labelField: "name",
          valueField: "id",
        },
        { name: "quantity", label: "Quantity", type: "number", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          defaultValue: "Active",
          options: ["Active", "Consumed", "Expired", "Recalled"],
        },
        { name: "notes", label: "Notes" },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "batch_number", label: "Batch" },
        { key: "product_id", label: "Product" },
        { key: "supplier_id", label: "Supplier" },
        { key: "quantity", label: "Quantity" },
        { key: "status", label: "Status", badge: true },
      ]}
    />
  );
}