import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "./mock-data";

interface Session {
  role: Role | null;
  name: string | null;
  setSession: (role: Role, name: string) => void;
  clear: () => void;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const r = localStorage.getItem("ck_role") as Role | null;
      const n = localStorage.getItem("ck_name");
      if (r) setRole(r);
      if (n) setName(n);
    } catch {}
  }, []);

  const setSession = (r: Role, n: string) => {
    setRole(r);
    setName(n);
    try {
      localStorage.setItem("ck_role", r);
      localStorage.setItem("ck_name", n);
    } catch {}
  };

  const clear = () => {
    setRole(null);
    setName(null);
    try {
      localStorage.removeItem("ck_role");
      localStorage.removeItem("ck_name");
    } catch {}
  };

  return <Ctx.Provider value={{ role, name, setSession, clear }}>{children}</Ctx.Provider>;
}

export function useSession() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSession must be used within SessionProvider");
  return c;
}
