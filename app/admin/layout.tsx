"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useQuery(api.users.getCurrentUser);
  const { logout } = useAuth();
  const pathname = usePathname();

  // Show loading while checking auth
  if (user === undefined) {
    return <LoadingPage />;
  }

  // Redirect if not logged in
  if (user === null) {
    redirect("/login?redirect=/admin");
  }

  // Redirect if not consultant
  if (user.role !== "consultant") {
    redirect("/home");
  }

  const handleLogout = async () => {
    await logout();
    redirect("/login");
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/workbooks", label: "Workbooks" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/settings", label: "Settings" },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/admin" className="text-2xl font-black text-gray-900">
              Reflekt
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                    isActive(item.href, item.exact)
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
