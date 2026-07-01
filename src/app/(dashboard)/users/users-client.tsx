"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CreateUserForm } from "@/components/users/create-user-form";
import { UsersList } from "@/components/users/users-list";
import { DashboardPageSkeleton } from "@/components/layout/dashboard-page-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import type { Profile } from "@/lib/types/database";

export default function UsersPageClient() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const fetchUsers = useCallback(async () => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const [{ data: profile }, { data: team }] = await Promise.all([
      supabase.from("profiles").select("role, id").eq("id", user.id).single(),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);

    if (profile?.role !== "admin") {
      setDenied(true);
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);
    setUsers((team as Profile[]) ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (denied) router.replace("/");
  }, [denied, router]);

  if (loading) return <DashboardPageSkeleton />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="User Management"
        description="Add, edit, and delete team accounts"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <CreateUserForm onCreated={fetchUsers} />
        <UsersList
          users={users}
          currentUserId={currentUserId}
          onChanged={fetchUsers}
        />
      </div>
    </div>
  );
}
