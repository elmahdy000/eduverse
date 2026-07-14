"use client";

import { useEffect, useState } from "react";
import { preset, ymd } from "@/lib/format";

export type DateRange = { from: string; to: string };

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const [activePreset, setActivePreset] = useState<string | null>("week");

  useEffect(() => {
    // اضبط أول مرة على الأسبوع
    if (!value.from && !value.to) {
      const p = preset("week");
      onChange(p);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setPreset = (name: "today" | "week" | "month" | "quarter") => {
    setActivePreset(name);
    onChange(preset(name));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-2">
        <button
          className={`op-btn-ghost ${activePreset === "today" ? "is-active" : ""}`}
          onClick={() => setPreset("today")}
        >
          اليوم
        </button>
        <button
          className={`op-btn-ghost ${activePreset === "week" ? "is-active" : ""}`}
          onClick={() => setPreset("week")}
        >
          آخر ٧ أيام
        </button>
        <button
          className={`op-btn-ghost ${activePreset === "month" ? "is-active" : ""}`}
          onClick={() => setPreset("month")}
        >
          آخر ٣٠ يوم
        </button>
        <button
          className={`op-btn-ghost ${activePreset === "quarter" ? "is-active" : ""}`}
          onClick={() => setPreset("quarter")}
        >
          آخر ٩٠ يوم
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>من</span>
        <input
          type="date"
          className="op-input"
          style={{ width: 160 }}
          value={value.from}
          onChange={(e) => {
            setActivePreset(null);
            onChange({ ...value, from: e.target.value });
          }}
        />
        <span>إلى</span>
        <input
          type="date"
          className="op-input"
          style={{ width: 160 }}
          value={value.to}
          max={ymd(new Date())}
          onChange={(e) => {
            setActivePreset(null);
            onChange({ ...value, to: e.target.value });
          }}
        />
      </div>
    </div>
  );
}
