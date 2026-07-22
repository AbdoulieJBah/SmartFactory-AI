"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { api, getErrorMessage } from "../lib/api";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users/");
      setUsers(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Delete this user?")) return;

    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="ml-72 min-h-screen flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-gray-500 mt-1">
            Manage system users and role access.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-gray-500">No users found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">
                    ID
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">
                    Role
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{user.id}</td>
                    <td className="p-3 text-sm">{user.full_name}</td>
                    <td className="p-3 text-sm">{user.email}</td>
                    <td className="p-3 text-sm">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
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
