"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteTeamUser } from "@/app/(dashboard)/users/actions";
import { EditUserModal } from "@/components/users/edit-user-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatRole } from "@/lib/roles";
import { formatStaffPower, getStaffPower } from "@/lib/permissions";
import type { Profile } from "@/lib/types/database";

export function UsersList({
  users,
  currentUserId,
  onChanged,
}: {
  users: Profile[];
  currentUserId: string;
  onChanged?: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(user: Profile) {
    if (!confirm(`Delete ${user.full_name}? This cannot be undone.`)) return;

    setDeletingId(user.id);
    setError(null);

    const result = await deleteTeamUser(user.id);
    setDeletingId(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    onChanged?.();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-stone-900">Team Members</h2>
          <p className="text-sm text-stone-500">{users.length} user(s)</p>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p className="mx-4 mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-6">
              {error}
            </p>
          )}

          {/* Mobile cards */}
          <div className="space-y-3 p-4 md:hidden">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-lg border border-stone-200 bg-stone-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-stone-900">{user.full_name}</p>
                    <p className="truncate text-sm text-stone-500">{user.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-stone-200">
                    {formatRole(user.role)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-700">
                  Power: {formatStaffPower(getStaffPower(user))}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-stone-400">
                    Joined {new Date(user.created_at).toLocaleDateString("en-IN")}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                      title="Edit user"
                    >
                      <Pencil className="h-4 w-4 text-stone-500" />
                    </Button>
                    {user.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id}
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="py-8 text-center text-sm text-stone-400">No users yet</p>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left text-stone-500">
                  <th className="px-4 py-3 font-medium lg:px-6">Name</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Email</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Role</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Power</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Joined</th>
                  <th className="px-4 py-3 text-right font-medium lg:px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                    <td className="px-4 py-4 font-medium text-stone-900 lg:px-6">
                      {user.full_name}
                    </td>
                    <td className="px-4 py-4 text-stone-600 lg:px-6">{user.email}</td>
                    <td className="px-4 py-4 lg:px-6">
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs">
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200">
                        {formatStaffPower(getStaffPower(user))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-stone-500 lg:px-6">
                      {new Date(user.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4 text-stone-500" />
                        </Button>
                        {user.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            disabled={deletingId === user.id}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                      No users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={onChanged}
        />
      )}
    </>
  );
}
