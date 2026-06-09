"use client";

import CrudPage from "../../components/CrudPage";

export default function QualityPage() {
  return (
    <CrudPage
      title="Quality Control"
      subtitle="Record inspections, defects, results, and corrective actions."
      endpoint="/quality-checks/"
      fields={[
        {
          name: "production_order_id",
          label: "Production Order",
          type: "select",
          required: true,
          apiEndpoint: "/production-orders/",
          labelField: "order_number",
          valueField: "id",
        },
        { name: "check_type", label: "Check Type", required: true },
        {
          name: "result",
          label: "Result",
          type: "select",
          defaultValue: "Pass",
          options: ["Pass", "Fail", "Warning"],
        },
        { name: "inspector_name", label: "Inspector", required: true },
        { name: "defects_count", label: "Defects Count", type: "number", defaultValue: "0" },
        { name: "corrective_action", label: "Corrective Action" },
        { name: "notes", label: "Notes" },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "production_order_id", label: "Order" },
        { key: "check_type", label: "Type" },
        { key: "result", label: "Result", badge: true },
        { key: "inspector_name", label: "Inspector" },
        { key: "defects_count", label: "Defects" },
        { key: "corrective_action", label: "Action" },
      ]}
    />
  );
}