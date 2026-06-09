"use client";

import CrudPage from "../../components/CrudPage";

export default function SalesOrdersPage() {
  return (
    <CrudPage
      title="Sales Orders"
      subtitle="Create and manage customer sales orders."
      endpoint="/sales-orders/"
      fields={[
        {
          name: "customer_id",
          label: "Customer",
          type: "select",
          required: true,
          apiEndpoint: "/customers/",
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
          options: ["Pending", "Confirmed", "Delivered", "Cancelled"],
        },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "customer_id", label: "Customer" },
        { key: "product_id", label: "Product" },
        { key: "quantity", label: "Quantity" },
        { key: "unit_price", label: "Unit Price" },
        { key: "status", label: "Status", badge: true },
      ]}
    />
  );
}