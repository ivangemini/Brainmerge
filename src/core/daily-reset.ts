export function calendarDateForTimestamp(timestamp: number): string {
  const date = new Date(Math.max(0, Math.floor(timestamp)));
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DailyUsage {
  count: number;
  date: string;
}

export function reconcileDailyUsage(count: number, usageDate: string | null, now: number, limit: number): DailyUsage {
  const today = calendarDateForTimestamp(now);
  return {
    count: usageDate === today ? Math.max(0, Math.min(limit, Math.floor(count))) : 0,
    date: today
  };
}
