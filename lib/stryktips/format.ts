const TIME_ZONE = "Europe/Stockholm";

const dayFormat = new Intl.DateTimeFormat("sv-SE", { weekday: "long", timeZone: TIME_ZONE });
const timeFormat = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });

/** "lördag" */
export function formatDay(iso: string) {
  return dayFormat.format(new Date(iso));
}

/** "15.59" */
export function formatTime(iso: string) {
  return timeFormat.format(new Date(iso)).replace(":", ".");
}

/** Swedish decimal comma: 1,23 */
export function formatNumber(value: number, decimals: number) {
  return value.toFixed(decimals).replace(".", ",");
}

/** "om 16 timmar och 31 minuter" */
export function formatTimeLeft(ms: number) {
  if (ms <= 0) return "har passerat";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [
    days && `${days} ${days === 1 ? "dag" : "dagar"}`,
    hours && `${hours} ${hours === 1 ? "timme" : "timmar"}`,
    `${minutes} ${minutes === 1 ? "minut" : "minuter"}`,
  ].filter(Boolean);
  return "om " + (parts.length > 1 ? parts.slice(0, -1).join(", ") + " och " + parts.at(-1) : parts[0]);
}

/** Signed change with a Swedish decimal comma: "+3", "−1,2", "±0" */
export function formatChange(value: number, decimals: number) {
  const rounded = Number(value.toFixed(decimals));
  if (rounded === 0) return "±0";
  return (rounded > 0 ? "+" : "−") + formatNumber(Math.abs(rounded), decimals);
}
