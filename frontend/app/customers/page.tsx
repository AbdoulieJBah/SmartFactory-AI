"use client";

import CrudPage from "../../components/CrudPage";

export default function CustomersPage() {
  return (
    <CrudPage
      title="Customers"
      subtitle="Manage customers, contacts, sales relationships, and status."
      endpoint="/customers/"
      fields={[
        { name: "name", label: "Customer Name", required: true },
        { name: "contact_person", label: "Contact Person" },
        { name: "email", label: "Email" },
        { name: "phone", label: "Phone" },
        { name: "address", label: "Address" },
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
        { key: "name", label: "Name" },
        { key: "contact_person", label: "Contact" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status", badge: true },
      ]}
    />
  );
}