"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingPage } from "@/components/ui/LoadingSpinner";

export default function Home() {
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; // Still loading

    // Redirect authenticated users to their dashboard
    if (user) {
      if (user.role === "consultant") {
        router.push("/admin");
      } else if (user.role === "client") {
        router.push("/home");
      }
    }
  }, [user, router]);

  // Show loading while checking auth
  if (user === undefined) return <LoadingPage />;

  // If authenticated, we're redirecting (show loading briefly)
  if (user) return <LoadingPage />;

  // Not authenticated - show landing page
  return (
    <main className="min-h-screen">
      <div className="section-container">
        <div className="section-inner text-center">
          <h1 className="text-hero mb-6">
            Reflekt
          </h1>
          <p className="text-body max-w-2xl mx-auto mb-10">
            Digital workbook platform for organizational consultants. Create, distribute, and manage reflective workbooks for your clients.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup?redirect=/admin" className="btn-primary">
              Get Started
            </Link>
            <Link href="/login?redirect=/admin" className="btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
