import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export  function randomPickFromArray(arr, count) {
  if (!Array.isArray(arr) || arr.length === 0) return [];

  count = Math.min(Math.max(0, count), arr.length);

  const result = [];
  const used = new Set();

  while (result.length < count) {
      const index = Math.floor(Math.random() * arr.length);

      if (!used.has(index)) {
          used.add(index);
          result.push(arr[index]);
      }
  }

  return result;
}
export function isSameWeek(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Set both to Monday of their week
  const getWeekStart = (d) => {
    const temp = new Date(d);
    const day = temp.getUTCDay() || 7; // Sunday = 7
    if (day !== 1) {
      temp.setUTCDate(temp.getUTCDate() - (day - 1));
    }
    temp.setUTCHours(0, 0, 0, 0);
    return temp.getTime();
  };

  return getWeekStart(d1) === getWeekStart(d2);
}

/**
 * Formats a date string into a human-readable relative time.
 * Example: "2026-04-02T12:00:00Z" -> "5 hours ago"
 */
export function formatTimeAgo(dateString: string | Date): string {
  if (!dateString) return "";

  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // If the date is in the future or invalid
  if (diffInSeconds < 0) return "just now";

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'min', seconds: 60 },
    { label: 'sec', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return "just now";
}


export const generateHslColors = (value: string | number, seed = 137.5) => {

  const hash = (str: string) => {
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0
    }
    return h
  }

  const normalized = String(value)
  const n = hash(normalized)

  const hue = (n * seed) % 360

  return {
    border: `hsl(${hue}, 70%, 50%)`,
    text: `hsl(${hue}, 80%, 40%)`,
    background: `hsl(${hue}, 90%, 95%)`,
  }
}

export const formatDateTime = (iso) => {
  const date = new Date(iso);

  return date.toLocaleString("en-PK", {
    dateStyle: "long",
    timeStyle: "short",
    hour12: true,
  });
};
export const formatDateOnly = (iso) => {
  const date = new Date(iso);

  return date.toLocaleDateString("en-PK", {
    dateStyle: "long",
  });
};

export function safeSum(array) {
  return array.reduce((acc, val) => {
    const num = Number(val);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
}

export const safeParseJsonArray = (str) => {
  try {
    const parsed = typeof str === 'string' ? JSON.parse(str) : str;
    return Array.isArray(parsed) ? parsed.filter(item => item !== null) : [];
  } catch (e) {
    return []; // Return empty array on failure
  }
};

export const timeToMinutes = (t = "") => {
  if (!t) return 0;

  const parts = t.split(":").map(Number);

  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;

  return h * 60 + m + s / 60;
};

export function formatTimeTo12Hour(time: string) {
  if (!time || typeof time !== "string") return "";

  // Only take HH:MM part, ignore seconds if present
  const [hourStr, minuteStr] = time.split(":");

  if (hourStr === undefined || minuteStr === undefined) return time;

  let hour = Number(hourStr);
  let minute = Number(minuteStr);

  if (isNaN(hour) || isNaN(minute)) return time;

  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12; // 0 => 12

  return `${hour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export const getNumberPosPostfixes = (number) => {
  switch (Number(number)) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return 'th'


  }
}
