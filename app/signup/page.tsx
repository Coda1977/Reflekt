"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import clsx from "clsx";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUpWithPassword } = useAuth();

  const redirectUrl = searchParams.get("redirect") || "/home";
  const shouldBeConsultant = redirectUrl.includes("/admin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"client" | "consultant">("client");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Set initial role based on redirect, but allow changing it
  useEffect(() => {
    if (shouldBeConsultant) {
      setRole("consultant");
    }
  }, [shouldBeConsultant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUpWithPassword({
        email,
        password,
        role,
      });

      if (result.success) {
        // If they signed up as consultant but redirect was /home (default), send to /admin
        // If they signed up as client but redirect was /admin, send to /home (safety)
        let finalRedirect = redirectUrl;
        if (role === "consultant" && !finalRedirect.includes("/admin")) {
          finalRedirect = "/admin";
        } else if (role === "client" && finalRedirect.includes("/admin")) {
          finalRedirect = "/home";
        }

        router.push(finalRedirect);
      } else {
        setError(result.error || "Failed to create account");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">Get Started</h1>
          <p className="text-gray-600">
            Create your account to continue
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selector */}
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setRole("client")}
                className={clsx(
                  "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
                  role === "client"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole("consultant")}
                className={clsx(
                  "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
                  role === "consultant"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                Consultant
              </button>
            </div>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              helperText="At least 8 characters"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Create {role === 'consultant' ? 'Consultant' : 'Client'} Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href={`/login${redirectUrl !== "/home" ? `?redirect=${redirectUrl}` : ""}`}
                className="text-accent-blue font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
