"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, ShieldCheck, UserPlus, Users, UserX } from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { dateTime } from "../../../lib/format";
import { translateStatus } from "../../../lib/labels";
import { useAuthStore } from "../../../store/auth-store";
import type { Paginated } from "../../../lib/types";
import { Alert, Btn, EmptyState, FormField, Input, Panel, SectionTitle, Select, StatCard } from "../../../components/ui";

interface RoleRecord {
  id: string;
  name: string;
}

interface UserRecord {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  status: string;
  lastLoginAt?: string | null;
  role?: { name: string } | null;
  createdAt?: string;
}

function roleLabel(name?: string | null) {
  if (name === "Owner") return "المالك";
  if (name === "Operations Manager") return "مدير التشغيل";
  if (name === "Receptionist") return "الاستقبال";
  if (name === "Barista") return "الباريستا";
  return name || "-";
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.role?.name === "Owner";

  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const usersQuery = useQuery({
    queryKey: ["users", "owner-page"],
    queryFn: async () => {
      const response = await api.get("/users", { params: { page: 1, limit: 200 } });
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
      await api.post("/users", { email, password, firstName, lastName, phoneNumber: phoneNumber || undefined, roleId });
    },
    onSuccess: () => {
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setRoleId("");
      setMessage({ text: "المستخدم اتضاف بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const apiMessage = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(apiMessage), ok: false });
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
      setMessage({ text: "بيانات المستخدم اتحدثت.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const apiMessage = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(apiMessage), ok: false });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "deactivate" | "reactivate" }) => {
      if (action === "deactivate") return api.delete(`/users/${userId}`);
      return api.post(`/users/${userId}/reactivate`);
    },
    onSuccess: () => {
      setMessage({ text: "حالة المستخدم اتغيرت.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const apiMessage = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(apiMessage), ok: false });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) return;
      await api.post(`/users/${currentUser.id}/change-password`, { currentPassword, newPassword });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setMessage({ text: "الباسورد اتغير بنجاح.", ok: true });
    },
    onError: (error: unknown) => {
      const apiMessage = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(apiMessage), ok: false });
    },
  });

  const users = usersQuery.data?.data ?? [];
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesStatus = statusFilter ? u.status === statusFilter : true;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase().includes(q) ||
        (u.phoneNumber ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [users, search, statusFilter]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "active").length;
    const inactive = users.filter((u) => u.status !== "active").length;
    const owners = users.filter((u) => u.role?.name === "Owner").length;
    return { total: users.length, active, inactive, owners };
  }, [users]);

  const selectedUser = filteredUsers.find((u) => u.id === selectedUserId) || users.find((u) => u.id === selectedUserId) || null;

  function selectUser(user: UserRecord) {
    setSelectedUserId(user.id);
    setEditFirstName(user.firstName ?? "");
    setEditLastName(user.lastName ?? "");
    setEditPhoneNumber(user.phoneNumber ?? "");
    setEditRoleId(rolesQuery.data?.find((role) => role.name === user.role?.name)?.id ?? "");
    setEditStatus(user.status);
  }

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

  return (
    <div className="space-y-6">
      <SectionTitle
        title="إدارة المستخدمين"
        subtitle="لوحة تفصيلية للمالك لإدارة الحسابات، الصلاحيات، والحالة التشغيلية لكل مستخدم."
        icon={<Users size={20} />}
      />

      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي المستخدمين" value={stats.total} icon={<Users size={18} />} />
        <StatCard label="الحسابات النشطة" value={stats.active} icon={<ShieldCheck size={18} />} tone="success" />
        <StatCard label="الحسابات غير النشطة" value={stats.inactive} icon={<UserX size={18} />} tone="warn" />
        <StatCard label="حسابات المالك" value={stats.owners} icon={<ShieldCheck size={18} />} tone="info" />
      </div>

      {isOwner && (
        <Panel title="إضافة مستخدم جديد" icon={<UserPlus size={16} />}>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={onCreateSubmit}>
            <FormField label="الإيميل"><Input value={email} onChange={(event) => setEmail(event.target.value)} required /></FormField>
            <FormField label="الباسورد"><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></FormField>
            <FormField label="الدور">
              <Select value={roleId} onChange={(event) => setRoleId(event.target.value)} required>
                <option value="">اختار الدور</option>
                {rolesQuery.data?.map((role) => <option key={role.id} value={role.id}>{roleLabel(role.name)}</option>)}
              </Select>
            </FormField>
            <FormField label="الاسم الأول"><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></FormField>
            <FormField label="الاسم الأخير"><Input value={lastName} onChange={(event) => setLastName(event.target.value)} required /></FormField>
            <FormField label="الموبايل"><Input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></FormField>
            <div className="md:col-span-3">
              <Btn type="submit" loading={createMutation.isPending} loadingText="جارٍ الإضافة...">إضافة مستخدم</Btn>
            </div>
          </form>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Panel title="قائمة المستخدمين" icon={<Users size={16} />}>
          <div className="mb-3 grid gap-2 md:grid-cols-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم، الإيميل، أو الموبايل" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">موقوف</option>
              <option value="suspended">معلق</option>
            </Select>
          </div>

          {usersQuery.isLoading ? (
            <p className="text-sm text-slate-500">جاري تحميل المستخدمين...</p>
          ) : filteredUsers.length === 0 ? (
            <EmptyState title="مفيش مستخدمين مطابقين للفلاتر" />
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "بدون اسم";
                const active = selectedUserId === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className={`w-full rounded-xl border p-3 text-right transition ${active ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">{translateStatus(user.status)}</span>
                      <span className="font-semibold text-slate-900">{name}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">الدور: {roleLabel(user.role?.name)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="تفاصيل المستخدم" icon={<ShieldCheck size={16} />}>
          {!selectedUser ? (
            <EmptyState title="اختار مستخدم من القائمة" sub="هتظهر هنا كل بياناته وإجراءات الإدارة." />
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p><strong>الاسم:</strong> {`${selectedUser.firstName ?? ""} ${selectedUser.lastName ?? ""}`.trim() || "-"}</p>
                <p><strong>الإيميل:</strong> {selectedUser.email}</p>
                <p><strong>الموبايل:</strong> {selectedUser.phoneNumber || "-"}</p>
                <p><strong>الدور الحالي:</strong> {roleLabel(selectedUser.role?.name)}</p>
                <p><strong>الحالة:</strong> {translateStatus(selectedUser.status)}</p>
                <p><strong>آخر دخول:</strong> {dateTime(selectedUser.lastLoginAt ?? null)}</p>
              </div>

              {isOwner && (
                <form className="space-y-3" onSubmit={onUpdateSubmit}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="الاسم الأول"><Input value={editFirstName} onChange={(event) => setEditFirstName(event.target.value)} required /></FormField>
                    <FormField label="الاسم الأخير"><Input value={editLastName} onChange={(event) => setEditLastName(event.target.value)} required /></FormField>
                    <FormField label="الموبايل"><Input value={editPhoneNumber} onChange={(event) => setEditPhoneNumber(event.target.value)} /></FormField>
                    <FormField label="الدور">
                      <Select value={editRoleId} onChange={(event) => setEditRoleId(event.target.value)}>
                        <option value="">اختار الدور</option>
                        {rolesQuery.data?.map((role) => <option key={role.id} value={role.id}>{roleLabel(role.name)}</option>)}
                      </Select>
                    </FormField>
                    <FormField label="الحالة">
                      <Select value={editStatus} onChange={(event) => setEditStatus(event.target.value)}>
                        <option value="active">نشط</option>
                        <option value="inactive">موقوف</option>
                        <option value="suspended">معلق</option>
                      </Select>
                    </FormField>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Btn type="submit" loading={updateMutation.isPending} loadingText="جارٍ الحفظ...">حفظ التعديلات</Btn>
                    {selectedUser.status === "active" ? (
                      <Btn type="button" variant="danger" onClick={() => statusMutation.mutate({ userId: selectedUser.id, action: "deactivate" })}>
                        إيقاف المستخدم
                      </Btn>
                    ) : (
                      <Btn type="button" variant="success" onClick={() => statusMutation.mutate({ userId: selectedUser.id, action: "reactivate" })}>
                        تفعيل المستخدم
                      </Btn>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="تغيير باسورد حسابك" icon={<Lock size={16} />}>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={onChangePasswordSubmit}>
          <FormField label="الباسورد الحالي"><Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></FormField>
          <FormField label="الباسورد الجديد"><Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></FormField>
          <div className="self-end">
            <Btn type="submit" loading={changePasswordMutation.isPending} loadingText="جارٍ التغيير...">تغيير الباسورد</Btn>
          </div>
        </form>
      </Panel>
    </div>
  );
}
