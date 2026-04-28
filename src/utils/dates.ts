export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function toISODate(date: Date): string {
  // Use UTC to avoid timezone issues
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert ISO date string to Date object at start of day in local timezone
 */
export function fromISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Compare two dates ignoring time components (timezone-aware)
 */
export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const date1 = typeof d1 === "string" ? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? new Date(d2) : d2;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date1 is before date2 (timezone-aware, compares only date parts)
 */
export function isBeforeDate(d1: Date | string, d2: Date | string): boolean {
  const date1 = typeof d1 === "string" ? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? new Date(d2) : d2;
  const start1 = new Date(
    date1.getFullYear(),
    date1.getMonth(),
    date1.getDate(),
  );
  const start2 = new Date(
    date2.getFullYear(),
    date2.getMonth(),
    date2.getDate(),
  );
  return start1.getTime() < start2.getTime();
}

/**
 * Check if date1 is after date2 (timezone-aware, compares only date parts)
 */
export function isAfterDate(d1: Date | string, d2: Date | string): boolean {
  const date1 = typeof d1 === "string" ? new Date(d1) : d1;
  const date2 = typeof d2 === "string" ? new Date(d2) : d2;
  const start1 = new Date(
    date1.getFullYear(),
    date1.getMonth(),
    date1.getDate(),
  );
  const start2 = new Date(
    date2.getFullYear(),
    date2.getMonth(),
    date2.getDate(),
  );
  return start1.getTime() > start2.getTime();
}

/**
 * Get the start of day for a given date (midnight in local timezone)
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Get the end of day for a given date (23:59:59.999 in local timezone)
 */
export function endOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
