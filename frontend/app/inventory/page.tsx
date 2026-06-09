"use client";

import CrudPage from "../../components/CrudPage";

export default function InventoryPage() {
  return (
    <CrudPage
      title="Inventory"
      subtitle="Track warehouse stock, reserved quantity, min/max stock, and replenishment levels."
      endpoint="/inventory/"
      fields={[
        {
          name: "product_id",
          label: "Product",
          type: "select",
          required: true,
          apiEndpoint: "/products/",
          labelField: "name",
          valueField: "id",
        },
        { name: "warehouse", label: "Warehouse", defaultValue: "Main Warehouse" },
        { name: "quantity", label: "Quantity", type: "number", required: true },
        { name: "reserved_quantity", label: "Reserved Qty", type: "number", defaultValue: "0" },
        { name: "min_stock", label: "Min Stock", type: "number", defaultValue: "50" },
        { name: "max_stock", label: "Max Stock", type: "number", defaultValue: "1000" },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "product_id", label: "Product" },
        { key: "warehouse", label: "Warehouse" },
        { key: "quantity", label: "Qty" },
        { key: "reserved_quantity", label: "Reserved" },
        { key: "min_stock", label: "Min" },
        { key: "max_stock", label: "Max" },
      ]}
    />
  );
}