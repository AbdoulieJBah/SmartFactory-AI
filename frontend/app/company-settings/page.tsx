"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";

interface Assignment {
  id: number;
  user_id: number;
  company_id: number;
  role: string;
}

export default function CompanySettingsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [form, setForm] = useState({
    user_id: "",
    company_id: "",
    role: "Member",
  });
  const [error, setError] = useState("");

  const fetchAssignments = async () => {
    try {
      setError("");
      const res = await api.get("/companies/assignments/all");
      setAssignments(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const assignUser = async () => {
    if (!form.user_id || !form.company_id) {
      setError("User ID and Company ID are required");
      return;
    }

    try {
      setError("");

      await api.post("/companies/assign-user", {
        user_id: Number(form.user_id),
        company_id: Number(form.company_id),
        role: form.role,
      });

      setForm({
        user_id: "",
        company_id: "",
        role: "Member",
      });

      fetchAssignments();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Company Settings</h1>
          <p className="text-gray-500 mt-1">
            Assign users to companies and manage tenant access.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Assign User to Company</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="border border-gray-300 rounded-lg p-2"
              placeholder="User ID"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            />

            <input
              className="border border-gray-300 rounded-lg p-2"
              placeholder="Company ID"
              value={form.company_id}
              onChange={(e) => setForm({ ...form, company_id: e.target.value })}
            />

            <select
              className="border border-gray-300 rounded-lg p-2"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option>Owner</option>
              <option>Admin</option>
              <option>Manager</option>
              <option>Member</option>
              <option>Viewer</option>
            </select>
          </div>

          <button
            onClick={assignUser}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Assign User
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {assignments.length === 0 ? (
            <div className="p-8 text-gray-500">No company assignments found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">ID</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">User ID</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Company ID</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">Role</th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{item.id}</td>
                    <td className="p-3 text-sm">{item.user_id}</td>
                    <td className="p-3 text-sm">{item.company_id}</td>
                    <td className="p-3 text-sm">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {item.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}