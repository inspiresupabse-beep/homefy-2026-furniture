"use client";

import { useState } from "react";
import { updateTeamUser } from "@/app/(dashboard)/users/actions";
import { Button } from "@/components/ui/button";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { Input, Label, Select } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { formatActionError } from "@/lib/action-error";
import { USER_ROLES } from "@/lib/roles";
import { STAFF_POWER_OPTIONS, getStaffPower } from "@/lib/permissions";
import type { Profile } from "@/lib/types/database";
import { X } from "lucide-react";

export function EditUserModal({
  user,
  onClose,
  onUpdated,
}: {
  user: Profile;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("user_id", user.id);

    let result;
    try {
      result = await updateTeamUser(formData);
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

    onClose();
    onUpdated?.();
  }

  return (
    <ModalOverlay onClose={onClose}>
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-stone-900">Edit User</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
          <div>
            <Label htmlFor="edit_full_name">Full Name</Label>
            <Input
              id="edit_full_name"
              name="full_name"
              defaultValue={user.full_name}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit_email">Email</Label>
            <Input
              id="edit_email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit_phone">Mobile Number</Label>
            <Input
              id="edit_phone"
              name="phone"
              type="tel"
              defaultValue={user.phone ?? ""}
              placeholder="9876543210"
              inputMode="numeric"
              pattern="[0-9+\s-]{10,14}"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit_role">Role</Label>
            <Select id="edit_role" name="role" defaultValue={user.role}>
              {USER_ROLES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="edit_staff_power">Staff Power</Label>
            <Select
              id="edit_staff_power"
              name="staff_power"
              defaultValue={getStaffPower(user)}
              disabled={user.role === "admin"}
            >
              {STAFF_POWER_OPTIONS.map(({ value, label, description }) => (
                <option key={value} value={value}>
                  {label} — {description}
                </option>
              ))}
            </Select>
            {user.role === "admin" && (
              <p className="mt-1 text-xs text-stone-400">Admins always have full access</p>
            )}
          </div>
          <div>
            <Label htmlFor="edit_password">New Password</Label>
            <PasswordInput
              id="edit_password"
              name="password"
              placeholder="Leave blank to keep current"
              minLength={6}
            />
          </div>

          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
    </ModalOverlay>
  );
}
