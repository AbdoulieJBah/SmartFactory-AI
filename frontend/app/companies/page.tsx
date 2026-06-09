"use client";

import CrudPage from "../../components/CrudPage";

export default function CompaniesPage() {
  return (
    <CrudPage
      title="Companies"
      subtitle="Manage tenant companies using SmartFactory AI."
      endpoint="/companies/"
      fields={[
        { name: "name", label: "Company Name", required: true },
        { name: "industry", label: "Industry" },
        { name: "country", label: "Country" },
        { name: "city", label: "City" },
        {
          name: "status",
          label: "Status",
          type: "select",
          defaultValue: "Active",
          options: ["Active", "Inactive"],
        },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Company" },
        { key: "industry", label: "Industry" },
        { key: "country", label: "Country" },
        { key: "city", label: "City" },
        { key: "status", label: "Status", badge: true },
      ]}
    />
  );
}