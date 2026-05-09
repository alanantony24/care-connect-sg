import { Delete } from "lucide-react";

export function PinDisplay({ value, length = 4 }: { value: string; length?: number }) {
  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length }).map((_, i) => {
        const filled = i < value.length;
        const focused = i === value.length;
        return (
          <div
            key={i}
            className={`size-14 rounded-2xl border-2 grid place-items-center transition-colors ${
              filled || focused ? "border-primary bg-card" : "border-border bg-muted/40"
            }`}
          >
            {filled ? (
              <span className="size-3 rounded-full bg-primary" />
            ) : focused ? (
              <span className="h-6 w-px bg-primary animate-pulse" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function PinKeypad({
  value,
  onChange,
  maxLength = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  const press = (n: string) => {
    if (value.length < maxLength) onChange(value + n);
  };
  const back = () => onChange(value.slice(0, -1));

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      {keys.map((k, i) => {
        if (k === "") return <div key={i} />;
        if (k === "back")
          return (
            <button
              key={i}
              type="button"
              onClick={back}
              className="h-14 grid place-items-center rounded-2xl text-foreground active:bg-muted transition-colors"
              aria-label="Backspace"
            >
              <Delete className="size-6" />
            </button>
          );
        return (
          <button
            key={i}
            type="button"
            onClick={() => press(k)}
            className="h-14 text-2xl font-semibold rounded-2xl active:bg-muted transition-colors"
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}
