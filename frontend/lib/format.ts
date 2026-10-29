const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

export function formatCurrency(cents: number, currency = "USD"): string {
  const amount = cents / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function formatDate(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS
): string {
  if (value === null || value === undefined || value === "") return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function formatRelative(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, secondsInUnit] of ranges) {
    if (Math.abs(seconds) >= secondsInUnit || unit === "second") {
      return formatter.format(Math.round(seconds / secondsInUnit), unit);
    }
  }

  return "now";
}

export function shortId(value: string | null | undefined, length = 8): string {
  if (!value) return "—";
  if (value.length <= length) return value;
  return `${value.slice(0, length)}…`;
}

export function getInitials(value: string | null | undefined): string {
  if (!value) return "U";

  const parts = value
    .replace(/@.*$/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join("");
  return initials || "U";
}
