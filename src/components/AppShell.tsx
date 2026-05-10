import { Link, useLocation } from "@tanstack/react-router";
import { Home, ClipboardList, UserRound } from "lucide-react";
import { useSession } from "@/lib/session";
import type { ReactNode } from "react";

const caregiverNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/feed", label: "Tasks", icon: ClipboardList },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const volunteerNav = [
  { to: "/volunteer", label: "Home", icon: Home },
  { to: "/feed", label: "Tasks", icon: ClipboardList },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({
  children,
  hideNav = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
}) {
  const { profile } = useSession();
  const location = useLocation();
  const nav = profile?.role === "volunteer" ? volunteerNav : caregiverNav;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-28">{children}</main>

      {!hideNav && (
        <nav className="fixed bottom-0 inset-x-0 z-40">
          <div className="container-app pb-3">
            <ul
              className="flex items-center justify-between rounded-full bg-card shadow-elevated border px-3 py-2"
              style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }}
            >
              {nav.map((item) => {
                const active =
                  location.pathname === item.to ||
                  (item.to !== "/dashboard" &&
                    item.to !== "/volunteer" &&
                    location.pathname.startsWith(item.to));
                const Icon = item.icon;
                const showAvatar = item.to === "/profile" && Boolean(profile?.avatar_url);
                return (
                  <li key={item.to} className="flex-1">
                    <Link
                      to={item.to}
                      className={`flex flex-col items-center gap-1 rounded-full py-2 text-[11px] font-medium transition-colors ${
                        active
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`grid place-items-center size-10 rounded-full transition-colors ${
                          active && !showAvatar ? "bg-primary text-primary-foreground" : ""
                        }`}
                      >
                        {showAvatar ? (
                          <img
                            src={profile?.avatar_url ?? ""}
                            alt=""
                            className={`size-8 rounded-full object-cover ring-2 ${
                              active ? "ring-primary" : "ring-border"
                            }`}
                          />
                        ) : (
                          <Icon className="size-5" strokeWidth={active ? 2.4 : 1.9} />
                        )}
                      </span>
                      <span className={active ? "text-foreground" : ""}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </nav>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
  back,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="container-app pt-6 pb-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>{back}</div>
        <div className="text-primary font-bold text-lg tracking-tight">Komunity</div>
        <div>{right}</div>
      </div>
      <h1 className="text-3xl font-bold leading-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
