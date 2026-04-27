"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import { useAuthStore } from "../../../store/auth-store";
import type { Paginated, RoleRecord, UserRecord } from "../../../lib/types";
import { DataTable, Panel, SectionTitle } from "../../../components/ui";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.role?.name === "Owner";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roleId, setRoleId] = useState("");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users", { params: { page: 1, limit: 100 } });
      return response.data.data as Paginated<UserRecord>;
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["users", "roles"],
    queryFn: async () => {
      const response = await api.get("/users/roles");
      return response.data.data as RoleRecord[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/users", {
        email,
        password,
        firstName,
        lastName,
        phoneNumber: phoneNumber || undefined,
        roleId,
      });
    },
    onSuccess: () => {
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setRoleId("");
      setMessage("المستخدم اتضاف.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      await api.put(`/users/${selectedUserId}`, {
        firstName: editFirstName,
        lastName: editLastName,
        phoneNumber: editPhoneNumber || undefined,
        roleId: editRoleId || undefined,
        status: editStatus,
      });
    },
    onSuccess: () => {
      setMessage("بيانات المستخدم اتعدلت.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "deactivate" | "reactivate" }) => {
      if (action === "deactivate") {
        await api.delete(`/users/${userId}`);
        return;
      }
      await api.post(`/users/${userId}/reactivate`);
    },
    onSuccess: () => {
      setMessage("حالة المستخدم اتغيرت.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) return;
      await api.post(`/users/${currentUser.id}/change-password`, {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setMessage("الباسورد اتغير.");
    },
    onError: (error: unknown) => {
      const apiMessage =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage(translateApiError(apiMessage));
    },
  });

  function onCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    createMutation.mutate();
  }

  function onUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    updateMutation.mutate();
  }

  function onChangePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    changePasswordMutation.mutate();
  }

  const rows = useMemo(
    () =>
      usersQuery.data?.data?.map((user) => [
        user.email,
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "-",
        user.role?.name ?? "-",
        translateStatus(user.status),
        dateTime(user.lastLoginAt ?? null),
      ]) ?? [],
    [usersQuery.data?.data],
  );

  const selectedUser = usersQuery.data?.data?.find((user) => user.id === selectedUserId) ?? null;

  return (
    <div className="space-y-5">
      <SectionTitle title="المستخدمين" subtitle="إدارة المستخدمين والأدوار، مع تغيير باسورد الحساب الحالي." />

      {isOwner ? (
        <Panel>
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-600">إضافة مستخدم جديد</h3>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={onCreateSubmit}>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="الإيميل" className="rounded-lg border border-slate-300 px-3 py-2" required />
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="الباسورد" type="password" className="rounded-lg border border-slate-300 px-3 py-2" required />
            <select value={roleId} onChange={(event) => setRoleId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" required>
              <option value="">اختار الدور</option>
              {rolesQuery.data?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="الاسم الأول" className="rounded-lg border border-slate-300 px-3 py-2" required />
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="الاسم الأخير" className="rounded-lg border border-slate-300 px-3 py-2" required />
            <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="الموبايل" className="rounded-lg border border-slate-300 px-3 py-2" />
            <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white md:col-span-3" disabled={createMutation.isPending}>
              {createMutation.isPending ? "بنضيف..." : "إضافة مستخدم"}
            </button>
          </form>
        </Panel>
      ) : null}

      <Panel>
        <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-600">قائمة المستخدمين</h3>
        <DataTable headers={["الإيميل", "الاسم", "الدور", "الحالة", "آخر دخول"]} rows={rows} />
        <div className="mt-3 flex flex-wrap gap-2">
          {usersQuery.data?.data?.map((user) => (
            <button
              key={user.id}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              onClick={() => {
                setSelectedUserId(user.id);
                setEditFirstName(user.firstName ?? "");
                setEditLastName(user.lastName ?? "");
                setEditPhoneNumber(user.phoneNumber ?? "");
                setEditRoleId(rolesQuery.data?.find((role) => role.name === user.role?.name)?.id ?? "");
                setEditStatus(user.status);
              }}
            >
              إدارة {user.email}
            </button>
          ))}
        </div>
      </Panel>

      {isOwner && selectedUser ? (
        <Panel>
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-600">تعديل المستخدم: {selectedUser.email}</h3>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={onUpdateSubmit}>
            <input value={editFirstName} onChange={(event) => setEditFirstName(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" required />
            <input value={editLastName} onChange={(event) => setEditLastName(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" required />
            <input value={editPhoneNumber} onChange={(event) => setEditPhoneNumber(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
            <select value={editRoleId} onChange={(event) => setEditRoleId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
              <option value="">اختار الدور</option>
              {rolesQuery.data?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
              <option value="active">شغال</option>
              <option value="inactive">موقوف</option>
              <option value="suspended">معلّق</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white" disabled={updateMutation.isPending}>
                حفظ
              </button>
              {selectedUser.status === "active" ? (
                <button type="button" className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => statusMutation.mutate({ userId: selectedUser.id, action: "deactivate" })}>
                  إيقاف
                </button>
              ) : (
                <button type="button" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => statusMutation.mutate({ userId: selectedUser.id, action: "reactivate" })}>
                  تفعيل
                </button>
              )}
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel>
        <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-600">تغيير باسوردي</h3>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={onChangePasswordSubmit}>
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="الباسورد الحالي" className="rounded-lg border border-slate-300 px-3 py-2" required />
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="الباسورد الجديد" className="rounded-lg border border-slate-300 px-3 py-2" required />
          <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? "بنغيّر..." : "تغيير الباسورد"}
          </button>
        </form>
      </Panel>

      {message ? (
        <Panel>
          <p className="text-sm text-slate-700">{message}</p>
        </Panel>
      ) : null}
    </div>
  );
}
