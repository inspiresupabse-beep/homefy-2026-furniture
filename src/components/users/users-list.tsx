"use client";

import { useState } from "react";
import { LogIn, Pencil, Trash2 } from "lucide-react";
import { deleteTeamUser, switchToUser } from "@/app/(dashboard)/users/actions";
import { EditUserModal } from "@/components/users/edit-user-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatRole } from "@/lib/roles";
import { formatStaffPower, getStaffPower } from "@/lib/permissions";
import { formatPhoneDisplay } from "@/lib/phone";
import type { Profile } from "@/lib/types/database";

function UserRowActions({
  user,
  currentUserId,
  switchingId,
  deletingId,
  onSwitch,
  onEdit,
  onDelete,
}: {
  user: Profile;
  currentUserId: string;
  switchingId: string | null;
  deletingId: string | null;
  onSwitch: (user: Profile) => void;
  onEdit: (user: Profile) => void;
  onDelete: (user: Profile) => void;
}) {
  const isSelf = user.id === currentUserId;
  const canSwitch = user.role !== "admin" && !isSelf;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {canSwitch && (
        <Button
          type="button"
          size="sm"
          className="gap-1.5 bg-stone-800 text-white hover:bg-stone-900"
          onClick={() => onSwitch(user)}
          disabled={switchingId === user.id}
        >
          <LogIn className="h-3.5 w-3.5 shrink-0" />
          {switchingId === user.id ? "Switching..." : "Switch"}
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="gap-1.5 border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200"
        onClick={() => onEdit(user)}
      >
        <Pencil className="h-3.5 w-3.5 shrink-0" />
        Edit
      </Button>
      {!isSelf && (
        <Button
          type="button"
          size="sm"
          variant="danger"
          className="gap-1.5"
          onClick={() => onDelete(user)}
          disabled={deletingId === user.id}
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" />
          {deletingId === user.id ? "Deleting..." : "Delete"}
        </Button>
      )}
    </div>
  );
}

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
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSwitch(user: Profile) {
    if (
      !confirm(
        `Switch to ${user.full_name}'s account? You can return to admin from the banner at the top.`
      )
    ) {
      return;
    }

    setSwitchingId(user.id);
    setError(null);

    const result = await switchToUser(user.id);
    setSwitchingId(null);

    if (result?.error) {
      setError(result.error);
    }
  }

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

          {users.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-stone-400">No users yet</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const meta = [
                  user.email,
                  user.phone ? formatPhoneDisplay(user.phone) : null,
                  formatRole(user.role),
                  formatStaffPower(getStaffPower(user)),
                  `Joined ${new Date(user.created_at).toLocaleDateString("en-IN")}`,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <li
                    key={user.id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900">
                        {user.full_name}
                        {isSelf && (
                          <span className="ml-2 text-sm font-normal text-stone-500">(you)</span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">{meta}</p>
                    </div>

                    <UserRowActions
                      user={user}
                      currentUserId={currentUserId}
                      switchingId={switchingId}
                      deletingId={deletingId}
                      onSwitch={handleSwitch}
                      onEdit={setEditingUser}
                      onDelete={handleDelete}
                    />
                  </li>
                );
              })}
            </ul>
          )}
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
