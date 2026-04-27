"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, Users, Clock, Edit, Power, PowerOff, MapPin, Plus, Search, RefreshCw, CheckCircle, X } from "lucide-react";
import { api } from "../../../lib/api";
import { translateApiError } from "../../../lib/errors";
import { money } from "../../../lib/format";
import { translateRoomType, translateStatus } from "../../../lib/labels";
import type { Paginated, Room } from "../../../lib/types";
import { Alert, Badge, Btn, DataTable, EmptyState, FormField, Input, Panel, SectionTitle, Select, StatCard, statusBadgeTone } from "../../../components/ui";
import clsx from "clsx";

type RoomWithRates = Room & {
  hourlyRate?: string | number | null;
  dailyRate?: string | number | null;
  features?: string[];
  notes?: string | null;
  activeSessions?: number;
  isOccupied?: boolean;
};

function RoomCard({ room, onEdit, onStatusChange }: {
  room: RoomWithRates;
  onEdit: (room: RoomWithRates) => void;
  onStatusChange: (roomId: string, action: "deactivate" | "reactivate") => void;
}) {
  const borderColors: Record<string, string> = {
    available: "border-emerald-200 bg-emerald-50/50",
    occupied: "border-amber-200 bg-amber-50/50",
    out_of_service: "border-rose-200 bg-rose-50/50",
    booked_soon: "border-blue-200 bg-blue-50/50",
    under_prep: "border-violet-200 bg-violet-50/50",
  };

  return (
    <div className={clsx("rounded-2xl border p-4 transition hover:shadow-md", borderColors[room.status] ?? "border-slate-200 bg-white")}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm">
            <DoorOpen size={20} className="text-slate-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{room.name}</h4>
            <p className="text-xs text-slate-500">{translateRoomType(room.roomType)}</p>
          </div>
        </div>
        <Badge tone={statusBadgeTone(room.status)}>{translateStatus(room.status)}</Badge>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Users size={14} />
          <span>السعة: {room.capacity}</span>
        </div>
        {room.hourlyRate && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock size={14} />
            <span>{money(room.hourlyRate)}/ساعة</span>
          </div>
        )}
        {room.isOccupied && (
          <div className="col-span-2 flex items-center gap-1.5 text-amber-700">
            <MapPin size={14} />
            <span>{room.activeSessions ?? 1} مدة نشطة</span>
          </div>
        )}
      </div>

      {room.features && room.features.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {room.features.slice(0, 3).map((f, i) => (
            <span key={i} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {f}
            </span>
          ))}
          {room.features.length > 3 && (
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-400">
              +{room.features.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(room)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Edit size={14} /> تعديل
        </button>
        {room.status === "out_of_service" ? (
          <button
            onClick={() => onStatusChange(room.id, "reactivate")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
          >
            <Power size={14} /> تفعيل
          </button>
        ) : (
          <button
            onClick={() => onStatusChange(room.id, "deactivate")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-600"
          >
            <PowerOff size={14} /> إيقاف
          </button>
        )}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState("meeting");
  const [capacity, setCapacity] = useState("4");
  const [hourlyRate, setHourlyRate] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [availabilityStart, setAvailabilityStart] = useState("");
  const [availabilityEnd, setAvailabilityEnd] = useState("");
  const [availabilityResult, setAvailabilityResult] = useState<RoomWithRates[] | null>(null);

  const [editingRoom, setEditingRoom] = useState<RoomWithRates | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState("1");
  const [editStatus, setEditStatus] = useState("available");

  const roomsQuery = useQuery({
    queryKey: ["rooms", statusFilter, searchQuery],
    queryFn: async () => {
      const r = await api.get("/rooms", {
        params: { page: 1, limit: 100, status: statusFilter || undefined, q: searchQuery || undefined },
      });
      return r.data.data as Paginated<RoomWithRates>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/rooms", {
        name, roomType, capacity: Number(capacity),
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        dailyRate: dailyRate ? Number(dailyRate) : undefined,
        features: featuresText ? featuresText.split(",").map((v) => v.trim()).filter(Boolean) : undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      setName(""); setRoomType("meeting"); setCapacity("4");
      setHourlyRate(""); setDailyRate(""); setFeaturesText(""); setNotes("");
      setShowAddForm(false);
      setMessage({ text: "تم إضافة الغرفة بنجاح.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingRoom) return;
      await api.put(`/rooms/${editingRoom.id}`, {
        name: editName,
        capacity: Number(editCapacity),
        status: editStatus,
      });
    },
    onSuccess: () => {
      setEditingRoom(null);
      setMessage({ text: "تم تعديل الغرفة.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ roomId, action }: { roomId: string; action: "deactivate" | "reactivate" }) => {
      await api.post(`/rooms/${roomId}/${action}`);
    },
    onSuccess: () => {
      setMessage({ text: "تم تغيير حالة الغرفة.", ok: true });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: async () => {
      const r = await api.get("/rooms/availability", {
        params: {
          startTime: new Date(availabilityStart).toISOString(),
          endTime: new Date(availabilityEnd).toISOString(),
        },
      });
      return r.data.data as RoomWithRates[];
    },
    onSuccess: (rooms) => {
      setAvailabilityResult(rooms);
      setMessage({ text: `${rooms.length} غرفة متاحة في الوقت ده.`, ok: true });
    },
    onError: (err: unknown) => {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setMessage({ text: translateApiError(m), ok: false });
    },
  });

  function onCreateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    createMutation.mutate();
  }

  function onUpdateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    updateMutation.mutate();
  }

  function startEdit(room: RoomWithRates) {
    setEditingRoom(room);
    setEditName(room.name);
    setEditCapacity(String(room.capacity));
    setEditStatus(room.status);
  }

  const rooms = roomsQuery.data?.data ?? [];
  const available = rooms.filter((r) => r.status === "available").length;
  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const offline = rooms.filter((r) => r.status === "out_of_service").length;

  return (
    <div className="space-y-6" dir="rtl">
      <SectionTitle
        title="الغرف"
        subtitle="إدارة كاملة للغرف: إضافة، تعديل، تشغيل/إيقاف، وفحص الإتاحة."
        icon={<DoorOpen size={20} />}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => roomsQuery.refetch()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={12} /> تحديث
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus size={12} /> إضافة غرفة
            </button>
          </div>
        }
      />

      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="إجمالي الغرف" value={rooms.length} icon={<DoorOpen size={18} />} />
        <StatCard label="متاحة" value={available} tone="success" icon={<CheckCircle size={18} />} />
        <StatCard label="مشغولة" value={occupied} tone="warn" icon={<Users size={18} />} />
        <StatCard label="متوقفة" value={offline} tone="danger" icon={<PowerOff size={18} />} />
      </div>

      {/* Add Room Form */}
      {showAddForm && (
        <Panel
          title="إضافة غرفة جديدة"
          icon={<Plus size={15} />}
          action={<button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>}
        >
          <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" onSubmit={onCreateSubmit}>
            <FormField label="اسم الغرفة">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: قاعة النجوم" required />
            </FormField>
            <FormField label="النوع">
              <Select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                <option value="coworking">مساحة شغل</option>
                <option value="study">مذاكرة</option>
                <option value="meeting">اجتماعات</option>
                <option value="hall">قاعة</option>
              </Select>
            </FormField>
            <FormField label="السعة (شخص)">
              <Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
            </FormField>
            <FormField label="سعر الساعة (اختياري)">
              <Input type="number" min="0" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="0.00" />
            </FormField>
            <FormField label="سعر اليوم (اختياري)">
              <Input type="number" min="0" step="0.01" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} placeholder="0.00" />
            </FormField>
            <FormField label="المميزات (مفصولة بفاصلة)">
              <Input value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="واي فاي، تكييف، بروجيكتور" />
            </FormField>
            <div className="md:col-span-2 lg:col-span-3">
              <FormField label="ملاحظات (اختياري)">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أي ملاحظات عن الغرفة" />
              </FormField>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Btn type="submit" loading={createMutation.isPending} loadingText="جاري الإضافة..." className="w-full" icon={<Plus size={14} />}>
                إضافة الغرفة
              </Btn>
            </div>
          </form>
        </Panel>
      )}

      {/* Edit Room Modal */}
      {editingRoom && (
        <Panel
          title={`تعديل: ${editingRoom.name}`}
          icon={<Edit size={15} />}
          action={<button onClick={() => setEditingRoom(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>}
        >
          <form className="grid gap-4 md:grid-cols-3" onSubmit={onUpdateSubmit}>
            <FormField label="الاسم">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </FormField>
            <FormField label="السعة">
              <Input type="number" min="1" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} required />
            </FormField>
            <FormField label="الحالة">
              <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="available">متاحة</option>
                <option value="occupied">مشغولة</option>
                <option value="out_of_service">متوقفة</option>
                <option value="booked_soon">محجوزة قريباً</option>
                <option value="under_prep">قيد التجهيز</option>
              </Select>
            </FormField>
            <div className="md:col-span-3">
              <Btn type="submit" loading={updateMutation.isPending} loadingText="جاري الحفظ..." icon={<Edit size={14} />}>
                حفظ التعديلات
              </Btn>
            </div>
          </form>
        </Panel>
      )}

      {/* Filters + Cards */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن غرفة..."
            className="rounded-xl border border-slate-300 bg-white py-2 pr-9 pl-4 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-900"
        >
          <option value="">كل الحالات</option>
          <option value="available">متاحة</option>
          <option value="occupied">مشغولة</option>
          <option value="out_of_service">متوقفة</option>
          <option value="booked_soon">محجوزة قريباً</option>
        </select>
      </div>

      {roomsQuery.isLoading ? (
        <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin text-slate-400" /></div>
      ) : rooms.length === 0 ? (
        <EmptyState icon={<DoorOpen size={40} />} title="لا توجد غرف" sub="أضف أول غرفة من الأعلى." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={startEdit}
              onStatusChange={(roomId, action) => statusMutation.mutate({ roomId, action })}
            />
          ))}
        </div>
      )}

      {/* Availability Checker */}
      <Panel title="فحص إتاحة الغرف" icon={<Clock size={15} />}>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="من">
            <input
              type="datetime-local"
              value={availabilityStart}
              onChange={(e) => setAvailabilityStart(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </FormField>
          <FormField label="إلى">
            <input
              type="datetime-local"
              value={availabilityEnd}
              onChange={(e) => setAvailabilityEnd(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </FormField>
          <div className="flex items-end">
            <Btn
              onClick={() => availabilityMutation.mutate()}
              loading={availabilityMutation.isPending}
              loadingText="جاري الفحص..."
              disabled={!availabilityStart || !availabilityEnd}
              className="w-full"
              variant="secondary"
              icon={<Search size={14} />}
            >
              فحص الإتاحة
            </Btn>
          </div>
        </div>

        {availabilityResult && (
          <div className="mt-4">
            {availabilityResult.length === 0 ? (
              <EmptyState icon={<DoorOpen size={32} />} title="لا توجد غرف متاحة" sub="جرب وقتاً مختلفاً." />
            ) : (
              <DataTable
                headers={["الغرفة", "النوع", "السعة", "سعر الساعة"]}
                rows={availabilityResult.map((r) => [
                  r.name,
                  translateRoomType(r.roomType),
                  r.capacity,
                  r.hourlyRate ? money(r.hourlyRate) : "—",
                ])}
              />
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
