"use client";

import { useState } from "react";
import { createTeamUser } from "@/app/(dashboard)/users/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { USER_ROLES } from "@/lib/roles";
import { STAFF_POWER_OPTIONS } from "@/lib/permissions";
import { formatActionError } from "@/lib/action-error";

export function CreateUserForm({ onCreated }: { onCreated?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(form);
    let result;
    try {
      result = await createTeamUser(formData);
    } catch (err) {
      setLoading(false);
      setError(formatActionError(err));
      return;
    }

    setLoading(false);

    if (result?.error) {
      setError(formatActionError(result.error));
      return;
    }

    setSuccess(true);
    form.reset();
    onCreated?.();
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-stone-900">Add New User</h2>
        <p className="text-sm text-stone-500">Create accounts for your team</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" placeholder="John Doe" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="agent@homefy.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue="sales_executive">
              {USER_ROLES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="staff_power">Staff Power</Label>
            <Select id="staff_power" name="staff_power" defaultValue="leads_and_orders">
              {STAFF_POWER_OPTIONS.filter((p) => p.value !== "full_access").map(
                ({ value, label, description }) => (
                  <option key={value} value={value}>
                    {label} — {description}
                  </option>
                )
              )}
            </Select>
            <p className="mt-1 text-xs text-stone-400">
              Controls what this user can access in the app
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              User created successfully.
            </p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
