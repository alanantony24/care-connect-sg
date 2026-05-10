import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Loader2 } from "lucide-react";
import type { PickedLocation } from "./LocationPicker";

const icon = L.icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

interface Props {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  placeholder?: string;
}

export default function LocationPickerClient({ value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<PickedLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const debounce = useRef<number | null>(null);

  const center = value ?? { lat: 1.3521, lng: 103.8198, label: "Singapore" };

  useEffect(() => {
    if (!query || query === value?.label) {
      setResults([]);
      return;
    }
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(async () => {
      setBusy(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=sg&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
        setResults(
          data.map((r) => ({
            label: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
          })),
        );
        setOpen(true);
      } catch {
        // ignore
      } finally {
        setBusy(false);
      }
    }, 350);
    return () => {
      if (debounce.current) window.clearTimeout(debounce.current);
    };
  }, [query, value?.label]);

  const pick = (r: PickedLocation) => {
    setQuery(r.label);
    setOpen(false);
    onChange(r);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex items-center gap-2 rounded-2xl border bg-card px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder={placeholder ?? "Search for an area or address"}
            className="flex-1 bg-transparent py-3 text-sm outline-none"
          />
          {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>
        {open && results.length > 0 && (
          <ul className="absolute z-[1000] mt-1 w-full rounded-2xl border bg-card shadow-elevated overflow-hidden">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60"
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden border h-56">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={value ? 14 : 11}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} icon={icon} />
              <Recenter lat={value.lat} lng={value.lng} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
