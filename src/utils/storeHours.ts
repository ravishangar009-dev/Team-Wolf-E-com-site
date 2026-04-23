export type StoreHours = {
  opening_time?: string | null;
  closing_time?: string | null;
  is_open?: boolean | null;
};

const parseTimeToMinutes = (time: string) => {
  // Supports formats like "07:00:00" or "07:00"
  const [hh, mm] = time.split(":");
  const h = Number(hh);
  const m = Number(mm ?? 0);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

export const formatStoreTime = (time: string | null | undefined) => {
  if (!time) return null;
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  const d = new Date();
  d.setHours(h, m, 0, 0);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
};

/**
 * Determines whether a store is open right now based on opening/closing times.
 * - If `is_open` is explicitly false -> closed.
 * - If either time missing -> assume open (don’t block orders).
 * - Handles overnight windows (e.g., 18:00 -> 02:00).
 */
export const isStoreOpenNow = (hours: StoreHours, now = new Date()) => {
  if (hours.is_open === false) return false;
  const open = hours.opening_time;
  const close = hours.closing_time;
  if (!open || !close) return true;

  const openMin = parseTimeToMinutes(open);
  const closeMin = parseTimeToMinutes(close);
  if (openMin === null || closeMin === null) return true;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (openMin === closeMin) return true;

  // Normal same-day window
  if (openMin < closeMin) return nowMin >= openMin && nowMin < closeMin;

  // Overnight window (e.g. 20:00 -> 02:00)
  return nowMin >= openMin || nowMin < closeMin;
};
