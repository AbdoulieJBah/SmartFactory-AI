"use client";

import CrudPage from "../../components/CrudPage";

export default function DowntimePage() {
  return (
    <CrudPage
      title="Downtime"
      subtitle="Monitor equipment downtime, reasons, and duration."
      endpoint="/downtime/"
      fields={[
        { name: "work_center_id", label: "Work Center ID", type: "number", required: true },
        { name: "reason", label: "Reason", required: true },
        { name: "duration_minutes", label: "Duration Minutes", type: "number", required: true },
        { name: "recorded_by", label: "Recorded By", required: true },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "work_center_id", label: "Work Center ID" },
        { key: "reason", label: "Reason" },
        { key: "duration_minutes", label: "Minutes" },
        { key: "recorded_by", label: "Recorded By" },
      ]}
    />
  );
}