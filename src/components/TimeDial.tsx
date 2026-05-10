import { useEffect, useRef } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const ITEM_H = 40;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function parse(value: string): { h: number; m: number } {
  const [hs, ms] = (value || "00:00").split(":");
  const h = Math.min(23, Math.max(0, parseInt(hs || "0", 10) || 0));
  const mRaw = Math.min(59, Math.max(0, parseInt(ms || "0", 10) || 0));
  const m = Math.round(mRaw / 5) * 5 % 60;
  return { h, m };
}

function Wheel({
  values,
  selected,
  onChange,
  format,
}: {
  values: number[];
  selected: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = values.indexOf(selected);
    if (idx >= 0) el.scrollTop = idx * ITEM_H;
  }, [selected, values]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_H);
      const v = values[Math.min(values.length - 1, Math.max(0, idx))];
      if (v !== selected) onChange(v);
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }, 80);
  };

  return (
    <div className="relative h-[120px] flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-card to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-2 top-10 h-10 rounded-lg bg-primary/10 border border-primary/30 z-0" />
      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: ITEM_H }} />
        {values.map((v) => (
          <div
            key={v}
            className={`h-10 flex items-center justify-center snap-center text-lg font-semibold tabular-nums ${
              v === selected ? "text-primary" : "text-muted-foreground"
            }`}
            style={{ scrollSnapAlign: "center" }}
          >
            {format(v)}
          </div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  );
}

export function TimeDial({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { h, m } = parse(value);
  return (
    <div className="rounded-2xl border bg-card p-2 flex items-stretch gap-1">
      <Wheel values={HOURS} selected={h} onChange={(nh) => onChange(`${pad(nh)}:${pad(m)}`)} format={pad} />
      <div className="self-center text-xl font-bold text-muted-foreground">:</div>
      <Wheel values={MINUTES} selected={m} onChange={(nm) => onChange(`${pad(h)}:${pad(nm)}`)} format={pad} />
    </div>
  );
}
