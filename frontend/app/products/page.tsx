"use client";

import CrudPage from "../../components/CrudPage";

export default function ProductsPage() {
  return (
    <CrudPage
      title="Products"
      subtitle="Manage finished goods, raw materials, pricing, and product status."
      endpoint="/products/"
      fields={[
        { name: "sku", label: "SKU", required: true },
        { name: "name", label: "Product Name", required: true },
        { name: "description", label: "Description" },
        { name: "category", label: "Category", defaultValue: "General" },
        { name: "unit", label: "Unit", defaultValue: "pcs" },
        { name: "cost_price", label: "Cost Price", type: "number", defaultValue: "0" },
        { name: "selling_price", label: "Selling Price", type: "number", defaultValue: "0" },
        { name: "reorder_level", label: "Reorder Level", type: "number", defaultValue: "50" },
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
        { key: "sku", label: "SKU" },
        { key: "name", label: "Name" },
        { key: "category", label: "Category" },
        { key: "unit", label: "Unit" },
        { key: "cost_price", label: "Cost" },
        { key: "selling_price", label: "Price" },
        { key: "status", label: "Status", badge: true },
      ]}
    />
  );
}