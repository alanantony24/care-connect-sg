import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg bg-card text-card-foreground border shadow-card p-4 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3 mt-7 first:mt-0">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
        {title}
      </h2>
      {action}
    </div>
  );
}

const toneMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success-foreground",
  warning: "bg-warning/20 text-warning-foreground",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
} as const;

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: keyof typeof toneMap;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="text-center py-10">
      <div className="mx-auto size-14 rounded-2xl gradient-warm grid place-items-center mb-3">
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: keyof typeof toneMap;
}) {
  return (
    <Card className="!p-4">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {hint && (
        <span className="mt-2 inline-block">
          <Pill tone={tone}>{hint}</Pill>
        </span>
      )}
    </Card>
  );
}
