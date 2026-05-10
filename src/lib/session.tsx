import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "caregiver" | "volunteer";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  avatar_url: string | null;
  tasks_helped: number;
  tasks_received: number;
}

interface Ctx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionCtx = createContext<Ctx | null>(null);
const LAST_ACTIVITY_KEY = "komunity:last-activity-at";
const INACTIVITY_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;
const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  };

  const refresh = async () => {
    if (session?.user?.id) await loadProfile(session.user.id);
  };

  useEffect(() => {
    const touchActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    };

    const enforceInactivityLimit = async (nextSession: Session | null) => {
      if (!nextSession) return false;

      const lastActivityRaw = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActivityAt = lastActivityRaw ? Number(lastActivityRaw) : Date.now();

      if (Date.now() - lastActivityAt <= INACTIVITY_LIMIT_MS) {
        touchActivity();
        return false;
      }

      await supabase.auth.signOut();
      setProfile(null);
      return true;
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      void (async () => {
        const expiredByInactivity = await enforceInactivityLimit(s);
        if (expiredByInactivity) {
          setSession(null);
          return;
        }

        setSession(s);
        if (s?.user?.id) {
          setTimeout(() => loadProfile(s.user.id), 0);
        } else {
          setProfile(null);
        }
      })();
    });

    const activityEvents: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "pointerdown",
      "scroll",
      "touchstart",
    ];
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, touchActivity, { passive: true }),
    );

    supabase.auth.getSession().then(async ({ data }) => {
      const expiredByInactivity = await enforceInactivityLimit(data.session);
      if (expiredByInactivity) {
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(data.session);
      if (data.session?.user?.id) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && session) touchActivity();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      sub.subscription.unsubscribe();
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, touchActivity));
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (loading || typeof window === "undefined") return;
    if (session) return;
    if (isPublicPath(window.location.pathname)) return;
    window.location.replace("/login");
  }, [loading, session]);

  const signOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    }
    setProfile(null);
  };

  return (
    <SessionCtx.Provider
      value={{ user: session?.user ?? null, session, profile, loading, refresh, signOut }}
    >
      {children}
    </SessionCtx.Provider>
  );
}

export function useSession() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("useSession must be used within SessionProvider");
  return c;
}
