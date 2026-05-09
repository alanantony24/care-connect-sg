import { Link, useLocation } from "@tanstack/react-router";
import { Heart, Home, Users, Calendar, Bell, Shield } from "lucide-react";
import { useSession } from "@/lib/session";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const caregiverNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  { to: "/requests", label: "Requests", icon: Users },
  { to: "/senior", label: "Senior", icon: Heart },
];

const volunteerNav: NavItem[] = [
  { to: "/volunteer", label: "Browse", icon: Home },
  { to: "/requests", label: "Requests", icon: Calendar },
  { to: "/senior", label: "Senior", icon: Heart },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: Shield },
  { to: "/requests", label: "Requests", icon: Calendar },
  { to: "/senior", label: "Seniors", icon: Users },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { role, name, clear } = useSession();
  const location = useLocation();
  const nav = role === "volunteer" ? volunteerNav : role === "admin" ? adminNav : caregiverNav;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container-app flex items-center justify-between py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="size-9 rounded-xl gradient-primary grid place-items-center text-primary-foreground">
              <Heart className="size-5" fill="currentColor" />
            </div>
            <div>
              <p className="font-semibold leading-none">CareKampung</p>
              <p className="text-[11px] text-muted-foreground capitalize">{role} · {name}</p>
            </div>
          </Link>
          <button
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <div className="container-app py-4">{children}</div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur-md">
        <div className="container-app">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }}>
            {nav.map((item) => {
              const active = location.pathname === item.to ||
                (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </nav>
    </div>
  );
}
