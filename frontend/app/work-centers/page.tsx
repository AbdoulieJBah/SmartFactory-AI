"use client";

import CrudPage from "../../components/CrudPage";

export default function WorkCentersPage() {
  return (
    <CrudPage
      title="Work Centers"
      subtitle="Manage machines, production lines, and operational status."
      endpoint="/work-centers/"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "description", label: "Description" },
        {
          name: "status",
          label: "Status",
          type: "select",
          defaultValue: "Running",
          options: ["Running", "Idle", "Stopped", "Maintenance"],
        },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "description", label: "Description" },
        { key: "status", label: "Status", badge: true },
      ]}
    />
  );
}