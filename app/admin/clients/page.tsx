"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";

export default function ClientsPage() {
  const clients = useQuery(api.users.getAllClients);

  if (clients === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-black mb-2">Clients</h1>
        <p className="text-gray-600">View all clients who have accessed your workbooks</p>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-2xl font-bold mb-2">No clients yet</h3>
          <p className="text-gray-600">
            When clients access your workbooks via QR codes, they'll appear here
          </p>
        </Card>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      {client.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {client.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/clients/${client._id}`}
                      className="text-accent-blue hover:text-accent-blue/80 font-semibold"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
