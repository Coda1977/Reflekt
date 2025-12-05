"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { redirect, useRouter } from "next/navigation";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function ClientHomePage() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const instances = useQuery(api.workbookInstances.getClientInstances);
  const { logout } = useAuth();

  if (user === undefined || instances === undefined) {
    return <LoadingPage />;
  }

  if (user === null) {
    redirect("/login");
  }

  if (user.role === "consultant") {
    redirect("/admin");
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Calculate statistics
  const totalWorkbooks = instances.length;
  const completedWorkbooks = instances.filter((i) => i.completedAt).length;
  const inProgressWorkbooks = instances.filter(
    (i) => i.startedAt && !i.completedAt
  ).length;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-black text-gray-900">Reflekt</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-4xl font-black mb-2">My Workbooks</h1>
            <p className="text-gray-600">
              Access and continue your reflective workbooks
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="text-4xl font-black text-accent-blue mb-2">
                {totalWorkbooks}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                Total Workbooks
              </div>
              <p className="text-sm text-gray-600">
                All workbooks assigned to you
              </p>
            </Card>

            <Card>
              <div className="text-4xl font-black text-accent-yellow mb-2">
                {inProgressWorkbooks}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                In Progress
              </div>
              <p className="text-sm text-gray-600">
                Workbooks you're currently working on
              </p>
            </Card>

            <Card>
              <div className="text-4xl font-black text-green-600 mb-2">
                {completedWorkbooks}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                Completed
              </div>
              <p className="text-sm text-gray-600">
                Workbooks you've finished
              </p>
            </Card>
          </div>

          {/* Workbooks List */}
          {instances.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold mb-2">No workbooks yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't been assigned any workbooks yet. Your consultant will send you
                a QR code or link to access your first workbook.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => {
                if (!instance.workbook) return null;

                const progress = instance.completedAt
                  ? 100
                  : instance.startedAt
                  ? 50
                  : 0;

                const statusColor =
                  progress === 100
                    ? "bg-green-100 text-green-700"
                    : progress > 0
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700";

                const statusText =
                  progress === 100
                    ? "Completed"
                    : progress > 0
                    ? "In Progress"
                    : "Not Started";

                return (
                  <Link key={instance._id} href={`/workbook/${instance._id}`}>
                    <Card hover className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {instance.workbook.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>
                              {instance.workbook.sections.length} sections
                            </span>
                            <span>•</span>
                            <span>
                              Updated{" "}
                              {new Date(
                                instance.lastUpdatedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}
                          >
                            {statusText}
                          </div>
                          <div className="text-accent-blue font-semibold">
                            Open →
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
