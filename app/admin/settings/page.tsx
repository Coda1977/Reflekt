"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const profile = useQuery(
    api.users.getConsultantProfile,
    user ? { userId: user._id } : "skip"
  );
  const createProfile = useMutation(api.users.createConsultantProfile);
  const updateBranding = useMutation(api.users.updateBranding);

  const [primaryColor, setPrimaryColor] = useState("#003566");
  const [secondaryColor, setSecondaryColor] = useState("#FFD60A");
  const [fontFamily, setFontFamily] = useState("system-ui");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile?.branding) {
      setPrimaryColor(profile.branding.primaryColor);
      setSecondaryColor(profile.branding.secondaryColor);
      setFontFamily(profile.branding.fontFamily);
    }
  }, [profile]);

  // Create profile if it doesn't exist
  useEffect(() => {
    if (user && profile === null && !isCreating) {
      setIsCreating(true);
      createProfile({ userId: user._id }).finally(() => setIsCreating(false));
    }
  }, [user, profile]);

  if (user === undefined || profile === undefined || isCreating) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <p>Please log in to access settings.</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      await updateBranding({
        profileId: profile._id,
        branding: {
          primaryColor,
          secondaryColor,
          fontFamily,
          logoUrl: profile.branding.logoUrl,
        },
      });
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const fontOptions = [
    { value: "system-ui", label: "System Default" },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "'Times New Roman', serif", label: "Times New Roman" },
    { value: "'Helvetica Neue', sans-serif", label: "Helvetica" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-black mb-2">Settings</h1>
        <p className="text-gray-600">
          Customize your branding for client-facing workbooks
        </p>
      </div>

      {/* Branding Settings */}
      <Card>
        <h2 className="text-2xl font-bold mb-6">Branding</h2>

        <div className="space-y-6">
          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-12 w-20 rounded border-2 border-gray-300 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#003566"
                  className="flex-1"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Used for headers and accents
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-12 w-20 rounded border-2 border-gray-300 cursor-pointer"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#FFD60A"
                  className="flex-1"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Used for highlights and buttons
              </p>
            </div>
          </div>

          {/* Font */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
            >
              {fontOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Font used in client workbooks
            </p>
          </div>

          {/* Logo Upload - Placeholder for now */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Logo (Coming Soon)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Logo upload will be available soon</p>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Preview
            </label>
            <div
              className="border-2 border-gray-200 rounded-lg p-6"
              style={{
                backgroundColor: primaryColor,
                color: "white",
                fontFamily: fontFamily,
              }}
            >
              <h3 className="text-2xl font-bold mb-2">Sample Workbook Header</h3>
              <p className="opacity-90">This is how your branding will appear to clients</p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Settings */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Role
            </label>
            <p className="text-gray-900 capitalize">{user.role}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
