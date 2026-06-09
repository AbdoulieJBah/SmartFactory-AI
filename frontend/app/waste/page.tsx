"use client";

import CrudPage from "../../components/CrudPage";

export default function WastePage() {
  return (
    <CrudPage
      title="Waste Tracking"
      subtitle="Track material waste, production losses, and operational reasons."
      endpoint="/waste-records/"
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
        { name: "quantity", label: "Quantity", type: "number", required: true },
        { name: "reason", label: "Reason", required: true },
        { name: "recorded_by", label: "Recorded By", required: true },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "product_id", label: "Product" },
        { key: "quantity", label: "Quantity" },
        { key: "reason", label: "Reason" },
        { key: "recorded_by", label: "Recorded By" },
      ]}
    />
  );
}