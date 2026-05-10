import { useEffect, useRef } from "react";

const ITEM_H = 44;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 5) out.push(`${pad(h)}:${pad(m)}`);
  return out;
})();

function snapValue(value: string): string {
  const [hs, ms] = (value || "09:00").split(":");
  const h = Math.min(23, Math.max(0, parseInt(hs || "9", 10) || 0));
  const mRaw = Math.min(59, Math.max(0, parseInt(ms || "0", 10) || 0));
  const m = (Math.round(mRaw / 5) * 5) % 60;
  return `${pad(h)}:${pad(m)}`;
}

export function TimeDial({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const tRef = useRef<number | null>(null);
  const snapped = snapValue(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = TIMES.indexOf(snapped);
    if (idx >= 0) el.scrollTop = idx * ITEM_H;
  }, [snapped]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_H);
      const v = TIMES[Math.min(TIMES.length - 1, Math.max(0, idx))];
      if (v !== snapped) onChange(v);
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }, 90);
  };

  return (
    <div className="relative h-[3.25rem] rounded-2xl border bg-card overflow-hidden">
      <div className="pointer-events-none absolute inset-x-2 inset-y-1 rounded-lg bg-primary/10 border border-primary/30 z-0" />
      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none relative z-10"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: 0 }} />
        {TIMES.map((t) => (
          <div
            key={t}
            className={`flex items-center justify-center snap-center text-base font-semibold tabular-nums ${
              t === snapped ? "text-primary" : "text-muted-foreground/60"
            }`}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
          >
            {t}
          </div>
        ))}
        <div style={{ height: 0 }} />
      </div>
    </div>
  );
}
