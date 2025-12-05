"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdminDashboard() {
  const workbooks = useQuery(api.workbooks.getWorkbooks);
  const clients = useQuery(api.users.getAllClients);

  if (workbooks === undefined || clients === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate stats
  const totalWorkbooks = workbooks.length;
  const totalClients = clients.length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your Reflekt dashboard</p>
        </div>
        <Link href="/admin/workbooks/new">
          <Button variant="primary">Create Workbook</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-5xl font-black text-accent-blue mb-2">
            {totalWorkbooks}
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-1">
            Total Workbooks
          </div>
          <p className="text-sm text-gray-600">
            Workbooks you've created
          </p>
        </Card>

        <Card>
          <div className="text-5xl font-black text-accent-yellow mb-2">
            {totalClients}
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-1">
            Total Clients
          </div>
          <p className="text-sm text-gray-600">
            Unique clients served
          </p>
        </Card>

        <Card>
          <div className="text-5xl font-black text-green-600 mb-2">
            {workbooks.filter(w => w.sections.length > 0).length}
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-1">
            Active Workbooks
          </div>
          <p className="text-sm text-gray-600">
            Workbooks with content
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/workbooks/new">
            <Card hover className="cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📝</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Create Workbook</h3>
                  <p className="text-gray-600">
                    Start a new workbook from scratch
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/workbooks">
            <Card hover className="cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📚</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">View Workbooks</h3>
                  <p className="text-gray-600">
                    See all your workbooks and manage them
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/clients">
            <Card hover className="cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="text-4xl">👥</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">View Clients</h3>
                  <p className="text-gray-600">
                    See all clients and their progress
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card hover className="cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="text-4xl">⚙️</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Settings</h3>
                  <p className="text-gray-600">
                    Customize your branding and preferences
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Workbooks */}
      {workbooks.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Workbooks</h2>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Sections
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workbooks.slice(0, 5).map((workbook) => (
                  <tr key={workbook._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {workbook.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {workbook.sections.length} sections
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(workbook.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/workbooks/${workbook._id}/edit`}
                        className="text-accent-blue hover:text-accent-blue/80 font-semibold"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
