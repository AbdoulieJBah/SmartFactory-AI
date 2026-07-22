"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

interface ProductionOrder {
  id: number;
  order_number: string;
  product_id: number;
  target_quantity: number;
  produced_quantity: number;
  status: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);

  const [form, setForm] = useState({
    order_number: "",
    product_id: "",
    target_quantity: "",
    produced_quantity: "0",
    status: "Planned",
  });

  const fetchOrders = async () => {
    const res = await axios.get(
      "http://127.0.0.1:8000/production-orders/"
    );
    setOrders(res.data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const createOrder = async () => {
    if (!form.order_number || !form.product_id || !form.target_quantity) {
      alert("Order number, Product ID, and Target Quantity are required");
      return;
    }

    await axios.post("http://127.0.0.1:8000/production-orders/", {
      order_number: form.order_number,
      product_id: Number(form.product_id),
      target_quantity: Number(form.target_quantity),
      produced_quantity: Number(form.produced_quantity),
      status: form.status,
    });

    setForm({
      order_number: "",
      product_id: "",
      target_quantity: "",
      produced_quantity: "0",
      status: "Planned",
    });

    fetchOrders();
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="ml-72 min-h-screen flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Production Orders</h1>

        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="grid grid-cols-5 gap-4">
            <input
              className="border p-2 rounded"
              placeholder="Order Number"
              value={form.order_number}
              onChange={(e) =>
                setForm({ ...form, order_number: e.target.value })
              }
            />

            <input
              className="border p-2 rounded"
              placeholder="Product ID"
              value={form.product_id}
              onChange={(e) =>
                setForm({ ...form, product_id: e.target.value })
              }
            />

            <input
              className="border p-2 rounded"
              placeholder="Target Quantity"
              value={form.target_quantity}
              onChange={(e) =>
                setForm({ ...form, target_quantity: e.target.value })
              }
            />

            <input
              className="border p-2 rounded"
              placeholder="Produced Quantity"
              value={form.produced_quantity}
              onChange={(e) =>
                setForm({ ...form, produced_quantity: e.target.value })
              }
            />

            <select
              className="border p-2 rounded"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option>Planned</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Paused</option>
            </select>
          </div>

          <button
            onClick={createOrder}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Order
          </button>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Order Number</th>
                <th className="p-3 text-left">Product ID</th>
                <th className="p-3 text-left">Target</th>
                <th className="p-3 text-left">Produced</th>
                <th className="p-3 text-left">Progress</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const progress =
                  order.target_quantity > 0
                    ? Math.round(
                        (order.produced_quantity / order.target_quantity) *
                          100
                      )
                    : 0;

                return (
                  <tr key={order.id} className="border-b">
                    <td className="p-3">{order.id}</td>
                    <td className="p-3">{order.order_number}</td>
                    <td className="p-3">{order.product_id}</td>
                    <td className="p-3">{order.target_quantity}</td>
                    <td className="p-3">{order.produced_quantity}</td>
                    <td className="p-3">{progress}%</td>
                    <td className="p-3 font-semibold">{order.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
