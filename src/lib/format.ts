// Friendly date/time formatters
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

export function formatDateFriendly(dateStr: string): string {
  // Accepts "YYYY-MM-DD" or ISO
  const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${DAYS[d.getDay()]}`;
}

export function formatTimeFriendly(timeStr: string): string {
  // Accepts "HH:MM" or "HH:MM-HH:MM" range
  const fmt = (t: string) => {
    const [hStr, mStr] = t.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr ?? "0", 10);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, "0")}${ampm}`;
  };
  if (timeStr.includes("-")) {
    const [s, e] = timeStr.split("-").map((p) => p.trim());
    return `${fmt(s)} – ${fmt(e)}`;
  }
  return fmt(timeStr);
}

export function formatDateTimeFriendly(dateStr: string, timeStr: string): string {
  return `${formatDateFriendly(dateStr)}, ${formatTimeFriendly(timeStr)}`;
}

export function getGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
