"use client";

import CrudPage from "../../components/CrudPage";

export default function MaintenancePage() {
  return (
    <CrudPage
      title="Maintenance"
      subtitle="Manage preventive and corrective maintenance work orders."
      endpoint="/maintenance/"
      fields={[
        {
          name: "work_center_id",
          label: "Work Center",
          type: "select",
          required: true,
          apiEndpoint: "/work-centers/",
          labelField: "name",
          valueField: "id",
        },
        { name: "title", label: "Title", required: true },
        { name: "description", label: "Description" },
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
          defaultValue: "Open",
          options: ["Open", "In Progress", "Completed", "Cancelled"],
        },
        { name: "assigned_to", label: "Assigned To" },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "work_center_id", label: "Work Center" },
        { key: "title", label: "Title" },
        { key: "priority", label: "Priority", badge: true },
        { key: "status", label: "Status", badge: true },
        { key: "assigned_to", label: "Assigned To" },
      ]}
    />
  );
}