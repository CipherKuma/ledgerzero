export function formatRelativeTime(value: string | number | Date | undefined, now = Date.now()) {
  if (!value) return "time unknown";

  const target = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(target)) return "time unknown";

  const deltaSeconds = Math.round((target - now) / 1000);
  const absoluteSeconds = Math.abs(deltaSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const [unit, secondsPerUnit] =
    units.find(([, seconds]) => absoluteSeconds >= seconds || seconds === 1) ?? units[units.length - 1];

  return formatter.format(Math.round(deltaSeconds / secondsPerUnit), unit);
}
