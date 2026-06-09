"use client";

import CrudPage from "../../components/CrudPage";

export default function ProductionOrdersPage() {
  return (
    <CrudPage
      title="Production Orders"
      subtitle="Plan, release, and monitor manufacturing execution orders."
      endpoint="/production-orders/"
      fields={[
        { name: "order_number", label: "Order Number", required: true },
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
          name: "work_center_id",
          label: "Work Center",
          type: "select",
          apiEndpoint: "/work-centers/",
          labelField: "name",
          valueField: "id",
        },
        { name: "target_quantity", label: "Target Quantity", type: "number", required: true },
        { name: "produced_quantity", label: "Produced Quantity", type: "number", defaultValue: "0" },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          defaultValue: "Normal",
          options: ["Low", "Normal", "High", "Urgent"],
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          defaultValue: "Planned",
          options: ["Planned", "Released", "In Progress", "Completed", "Cancelled"],
        },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "order_number", label: "Order No." },
        { key: "product_id", label: "Product" },
        { key: "work_center_id", label: "Work Center" },
        { key: "target_quantity", label: "Target" },
        { key: "produced_quantity", label: "Produced" },
        { key: "priority", label: "Priority", badge: true },
        { key: "status", label: "Status", badge: true },
      ]}
    />
  );
}