import { Link, useLocation } from "@tanstack/react-router";
import {
  CalendarDays,
  HeartHandshake,
  Home,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { useSession } from "@/lib/session";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const caregiverNav: NavItem[] = [
  { to: "/dashboard", label: "Today", icon: Home },
  { to: "/requests", label: "Help", icon: UsersRound },
  { to: "/schedule", label: "Visits", icon: CalendarDays },
  { to: "/senior", label: "Profile", icon: UserRoundCheck },
];

const volunteerNav: NavItem[] = [
  { to: "/volunteer", label: "Open", icon: Home },
  { to: "/requests", label: "Tasks", icon: CalendarDays },
  { to: "/senior", label: "Notes", icon: UserRoundCheck },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: ShieldCheck },
  { to: "/requests", label: "Tasks", icon: CalendarDays },
  { to: "/senior", label: "Profiles", icon: UsersRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { role, name, clear } = useSession();
  const location = useLocation();
  const nav = role === "volunteer" ? volunteerNav : role === "admin" ? adminNav : caregiverNav;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container-app flex items-center justify-between py-3">
          <Link
            to={role === "volunteer" ? "/volunteer" : role === "admin" ? "/admin" : "/dashboard"}
            className="flex items-center gap-3"
          >
            <div className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <HeartHandshake className="size-5" />
            </div>
            <div>
              <p className="font-semibold leading-none">CareKampung</p>
              <p className="text-xs text-muted-foreground capitalize">
                {role} account: {name}
              </p>
            </div>
          </Link>
          <button
            onClick={clear}
            className="rounded-md border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-10 md:pl-56">
        <div className="container-app py-5">{children}</div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur md:hidden">
        <div className="container-app">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }}>
            {nav.map((item) => {
              const active =
                location.pathname === item.to ||
                (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.5 : 1.9} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </nav>

      <aside className="hidden md:block fixed left-0 top-[65px] bottom-0 w-56 border-r bg-card">
        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
