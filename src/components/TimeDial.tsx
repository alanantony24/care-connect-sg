import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Clock } from "lucide-react";

const ITEM_H = 40;
const WHEEL_H = 104;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function snapValue(value: string): string {
  const [hs, ms] = (value || "09:00").split(":");
  const h = Math.min(23, Math.max(0, parseInt(hs || "9", 10) || 0));
  const mRaw = Math.min(59, Math.max(0, parseInt(ms || "0", 10) || 0));
  const rounded = Math.round(mRaw / 5) * 5;
  const m = rounded === 60 ? 55 : rounded;
  return `${pad(h)}:${pad(m)}`;
}

function splitTime(value: string) {
  const snapped = snapValue(value);
  const [h, m] = snapped.split(":").map(Number);
  return { snapped, hour: h, minute: m };
}

export function TimeDial({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { snapped, hour, minute } = splitTime(value);

  useEffect(() => {
    if (!value) onChange(snapped);
  }, [onChange, snapped, value]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const selectTime = (nextHour: number, nextMinute: number) => {
    onChange(`${pad(nextHour)}:${pad(nextMinute)}`);
  };

  return (
    <div ref={rootRef} className="relative">
      <input id={id} tabIndex={-1} className="sr-only" value={snapped} readOnly required />
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="h-[3.35rem] w-full rounded-[0.875rem] border bg-card px-4 text-left text-foreground outline-none transition-shadow focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 flex items-center gap-3"
      >
        <Clock className="size-4 text-muted-foreground" />
        <span className="flex-1 text-base font-semibold tabular-nums">{snapped}</span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={`${id}-panel`}
          className="relative mt-2 rounded-2xl border bg-card p-3 shadow-card"
        >
          <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-10 -translate-y-1/2 rounded-xl border border-primary/30 bg-primary/10" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <TimeWheel
              label="Hour"
              values={HOURS}
              selected={hour}
              format={pad}
              onSelect={(nextHour) => selectTime(nextHour, minute)}
            />
            <span className="relative z-10 text-xl font-bold text-primary">:</span>
            <TimeWheel
              label="Minute"
              values={MINUTES}
              selected={minute}
              format={pad}
              onSelect={(nextMinute) => selectTime(hour, nextMinute)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TimeWheel({
  label,
  values,
  selected,
  format,
  onSelect,
}: {
  label: string;
  values: number[];
  selected: number;
  format: (value: number) => string;
  onSelect: (value: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * ITEM_H;
  }, [selected, values]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => {
      const idx = Math.min(values.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
      onSelect(values[idx]);
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }, 80);
  };

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      className="relative z-10 overflow-y-auto snap-y snap-mandatory scrollbar-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ height: WHEEL_H, scrollSnapType: "y mandatory" }}
    >
      <div style={{ height: (WHEEL_H - ITEM_H) / 2 }} />
      {values.map((value) => (
        <button
          type="button"
          key={value}
          role="option"
          aria-selected={value === selected}
          onClick={() => onSelect(value)}
          className={`flex h-10 w-full snap-center items-center justify-center rounded-lg text-base font-semibold tabular-nums ${
            value === selected ? "text-primary" : "text-muted-foreground/60"
          }`}
          style={{ scrollSnapAlign: "center" }}
        >
          {format(value)}
        </button>
      ))}
      <div style={{ height: (WHEEL_H - ITEM_H) / 2 }} />
    </div>
  );
}
