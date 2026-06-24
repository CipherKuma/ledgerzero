"use client";

import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
const QUICK_TIMES = ["09:00", "12:00", "15:00", "18:00", "21:00"];

export function splitDeadlineTime(value: string) {
  const [hour = "18", minute = "00"] = value.split(":");
  return {
    hour: HOURS.includes(hour) ? hour : "18",
    minute: MINUTES.includes(minute) ? minute : "00",
  };
}

export function DeadlineTimePicker({
  value,
  open,
  onOpenChange,
  onValueChange,
  onPartChange,
}: {
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  onPartChange: (part: "hour" | "minute", value: string) => void;
}) {
  const { hour, minute } = splitDeadlineTime(value);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className="w-full justify-between text-left" aria-label="Choose deadline time in UTC" />
        }
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <Clock3 data-icon="inline-start" />
          <span className="font-mono text-base">{hour}:{minute}</span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">UTC</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(360px,calc(100vw-2rem))] gap-4 p-4">
        <div className="grid gap-1">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            UTC deadline time
          </div>
          <div className="font-mono text-2xl text-foreground">{hour}:{minute}</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TimeSelect label="Hour" value={hour} values={HOURS} onValueChange={(next) => onPartChange("hour", next)} />
          <TimeSelect label="Minute" value={minute} values={MINUTES} onValueChange={(next) => onPartChange("minute", next)} />
        </div>
        <div className="grid gap-2">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Presets</div>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_TIMES.map((time) => (
              <Button key={time} type="button" size="sm" variant={value === time ? "default" : "outline"} onClick={() => onValueChange(time)}>
                {time}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex justify-end border-t pt-3">
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeSelect({
  label,
  value,
  values,
  onValueChange,
}: {
  label: string;
  value: string;
  values: string[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={(next) => next && onValueChange(next)}>
        <SelectTrigger className="w-full">
          <span className="font-mono">{value}</span>
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {values.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
