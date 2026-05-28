import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ClockTimePickerProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

type Mode = "hour" | "minute";

const pad = (n: number) => String(n).padStart(2, "0");

const parseValue = (v: string): { h: number; m: number } => {
  const [hh, mm] = (v || "00:00").split(":");
  const h = Math.min(23, Math.max(0, parseInt(hh || "0", 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(mm || "0", 10) || 0));
  return { h, m };
};

// Clock layout constants
const SIZE = 240;
const CENTER = SIZE / 2;
const OUTER_R = 100; // hours 13-00 (outer ring)
const INNER_R = 70;  // hours 1-12 (inner ring)
const MIN_R = 100;   // minutes ring

export function ClockTimePicker({
  value,
  onChange,
  className,
  placeholder = "--:--",
  disabled,
}: ClockTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("hour");
  const [draft, setDraft] = useState(() => parseValue(value));
  const dialRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setDraft(parseValue(value));
      setMode("hour");
    }
  }, [open, value]);

  const handleConfirm = () => {
    onChange(`${pad(draft.h)}:${pad(draft.m)}`);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  const computeFromPoint = (clientX: number, clientY: number) => {
    const el = dialRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left - CENTER;
    const y = clientY - rect.top - CENTER;
    const dist = Math.sqrt(x * x + y * y);
    // angle from 12 o'clock, clockwise, in degrees (0..360)
    let angle = Math.atan2(x, -y) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    if (mode === "hour") {
      // 12 segments of 30°
      const step = Math.round(angle / 30) % 12; // 0..11 (0 = top)
      const useOuter = dist > (OUTER_R + INNER_R) / 2;
      let hour: number;
      if (useOuter) {
        // outer: 13..23, 00 at top
        hour = step === 0 ? 0 : 12 + step;
      } else {
        // inner: 12 at top, 1..11
        hour = step === 0 ? 12 : step;
      }
      setDraft((d) => ({ ...d, h: hour }));
    } else {
      // minutes: 60 steps of 6°
      const minute = Math.round(angle / 6) % 60;
      setDraft((d) => ({ ...d, m: minute }));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    computeFromPoint(e.clientX, e.clientY);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    computeFromPoint(e.clientX, e.clientY);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    if (mode === "hour") setMode("minute");
  };

  // Hand angle
  const handAngle = useMemo(() => {
    if (mode === "hour") {
      const h = draft.h % 12;
      return h * 30;
    }
    return draft.m * 6;
  }, [mode, draft]);

  const handLength = useMemo(() => {
    if (mode === "hour") {
      // inner ring if 1..12, outer if 0 or 13..23
      return draft.h === 0 || draft.h > 12 ? OUTER_R : INNER_R;
    }
    return MIN_R;
  }, [mode, draft]);

  // Numbers
  const hourNumbers = useMemo(() => {
    const items: { label: string; x: number; y: number; value: number; outer: boolean }[] = [];
    // Inner ring: 12 at top, then 1..11
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = CENTER + INNER_R * Math.cos(angle);
      const y = CENTER + INNER_R * Math.sin(angle);
      const value = i === 0 ? 12 : i;
      items.push({ label: String(value), x, y, value, outer: false });
    }
    // Outer ring: 00 at top, then 13..23
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = CENTER + OUTER_R * Math.cos(angle);
      const y = CENTER + OUTER_R * Math.sin(angle);
      const value = i === 0 ? 0 : 12 + i;
      items.push({ label: pad(value), x, y, value, outer: true });
    }
    return items;
  }, []);

  const minuteNumbers = useMemo(() => {
    const items: { label: string; x: number; y: number; value: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const value = i * 5;
      const angle = (value * 6 - 90) * (Math.PI / 180);
      const x = CENTER + MIN_R * Math.cos(angle);
      const y = CENTER + MIN_R * Math.sin(angle);
      items.push({ label: pad(value), x, y, value });
    }
    return items;
  }, []);

  const displayValue = value && /^\d{1,2}:\d{2}$/.test(value) ? value : "";

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={cn(!displayValue && "text-muted-foreground")}>
            {displayValue || placeholder}
          </span>
          <Clock className="h-4 w-4 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-0 bg-transparent shadow-none"
        align="start"
      >
        <div className="bg-zinc-900 text-zinc-100 rounded-xl shadow-2xl p-4 w-[300px] select-none">
          {/* Header / display */}
          <div className="flex items-center justify-center gap-1 text-4xl font-light mb-4">
            <button
              type="button"
              onClick={() => setMode("hour")}
              className={cn(
                "px-2 py-1 rounded transition-colors",
                mode === "hour" ? "text-sky-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {pad(draft.h)}
            </button>
            <span className="text-zinc-500">:</span>
            <button
              type="button"
              onClick={() => setMode("minute")}
              className={cn(
                "px-2 py-1 rounded transition-colors",
                mode === "minute" ? "text-sky-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {pad(draft.m)}
            </button>
          </div>

          {/* Clock dial */}
          <div
            ref={dialRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative mx-auto rounded-full bg-zinc-800/70 touch-none cursor-pointer"
            style={{ width: SIZE, height: SIZE }}
          >
            {/* Hand */}
            <div
              className="absolute left-1/2 top-1/2 origin-bottom bg-sky-500"
              style={{
                width: 2,
                height: handLength,
                transform: `translate(-50%, -100%) rotate(${handAngle}deg)`,
                transformOrigin: "50% 100%",
              }}
            />
            {/* Selected dot */}
            <div
              className="absolute left-1/2 top-1/2 rounded-full bg-sky-500"
              style={{
                width: 32,
                height: 32,
                transform: `translate(-50%, -50%) translate(${handLength * Math.sin((handAngle * Math.PI) / 180)}px, ${-handLength * Math.cos((handAngle * Math.PI) / 180)}px)`,
              }}
            />
            {/* Center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-sky-500" />

            {/* Numbers */}
            {mode === "hour"
              ? hourNumbers.map((n) => {
                  const selected = n.value === draft.h;
                  return (
                    <div
                      key={`${n.outer ? "o" : "i"}-${n.value}`}
                      className={cn(
                        "absolute flex items-center justify-center pointer-events-none rounded-full font-medium",
                        n.outer ? "text-xs text-zinc-400" : "text-base",
                        selected && "text-white"
                      )}
                      style={{
                        width: 28,
                        height: 28,
                        left: n.x,
                        top: n.y,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {n.label}
                    </div>
                  );
                })
              : minuteNumbers.map((n) => {
                  const selected = n.value === draft.m;
                  return (
                    <div
                      key={`m-${n.value}`}
                      className={cn(
                        "absolute flex items-center justify-center pointer-events-none rounded-full text-base font-medium",
                        selected && "text-white"
                      )}
                      style={{
                        width: 28,
                        height: 28,
                        left: n.x,
                        top: n.y,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {n.label}
                    </div>
                  );
                })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 text-sm font-semibold">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-sky-400 hover:text-sky-300"
            >
              LIMPAR
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sky-400 hover:text-sky-300"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-3 py-2 text-sky-400 hover:text-sky-300"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
