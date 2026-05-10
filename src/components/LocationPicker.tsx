import { lazy, Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export interface PickedLocation {
  label: string;
  lat: number;
  lng: number;
}

const Inner = lazy(() => import("./LocationPickerClient"));

export function LocationPicker(props: {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  placeholder?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="h-72 rounded-2xl border bg-card grid place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="h-72 rounded-2xl border bg-card grid place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <Inner {...props} />
    </Suspense>
  );
}
