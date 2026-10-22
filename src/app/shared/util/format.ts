const dayHour = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
const dayOnly = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' });
const full = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const rel = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export const fmtDayHour = (iso: string) => dayHour.format(new Date(iso));
export const fmtDay = (iso: string) => dayOnly.format(new Date(iso));
export const fmtFull = (iso: string) => full.format(new Date(iso));

export function fmtRelative(iso: string): string {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(diffMin) < 60) return rel.format(diffMin, 'minute');
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 48) return rel.format(diffH, 'hour');
  return rel.format(Math.round(diffH / 24), 'day');
}

export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/** Groups hourly points by calendar day (local time) and reduces each group. */
export function byDay<T extends { ts: string }>(points: T[], reduce: (group: T[]) => number): { label: string; value: number }[] {
  const groups = new Map<string, T[]>();
  for (const p of points) {
    const key = new Date(p.ts).toDateString();
    const g = groups.get(key);
    if (g) g.push(p);
    else groups.set(key, [p]);
  }
  return [...groups.values()].map((g) => ({ label: fmtDay(g[0].ts), value: round(reduce(g), 1) }));
}

/** Percent change between the last 24 points and the 24 before them. */
export function delta24h(values: number[]): number | null {
  if (values.length < 48) return null;
  const cur = avg(values.slice(-24));
  const prev = avg(values.slice(-48, -24));
  if (prev === 0) return null;
  return round(((cur - prev) / prev) * 100, 1);
}
