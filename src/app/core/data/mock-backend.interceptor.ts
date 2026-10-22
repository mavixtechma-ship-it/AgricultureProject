import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, Observable, defer, delay, map, of, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Device, Farm, FarmAlert, SensorFamily } from './models';

/** Virtual API prefix answered entirely in the browser from src/assets/mock/*.json. */
export const MOCK_API = '/mock-api';
const LATENCY_MS = 220;
const HOURS = 168;

interface RawSeries {
  fieldId: string;
  intervalMinutes: number;
  metrics: Record<string, (number | boolean)[]>;
}
interface RawAlert extends Omit<FarmAlert, 'raisedAt'> {
  hoursAgo: number;
}

// ---- in-memory state: writes live here until the tab is reloaded ----
const fileCache = new Map<string, Observable<unknown>>();
let devices: Device[] | null = null;
let alerts: FarmAlert[] | null = null;

function loadFile<T>(name: string, next: HttpHandlerFn): Observable<T> {
  let file$ = fileCache.get(name);
  if (!file$) {
    const fileReq = new HttpRequest<unknown>('GET', `assets/mock/${name}.json`, { responseType: 'json' });
    file$ = next(fileReq).pipe(
      switchMap((ev: HttpEvent<unknown>) => (ev instanceof HttpResponse ? of(ev.body) : EMPTY)),
      shareReplay(1)
    );
    fileCache.set(name, file$);
  }
  return file$ as Observable<T>;
}

function ok<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse<T>({ status: 200, body })).pipe(delay(LATENCY_MS));
}

function fail(status: number, message: string, url: string): Observable<never> {
  return defer(() =>
    throwError(() => new HttpErrorResponse({ status, statusText: message, url, error: { message } }))
  );
}

/** The 168 hourly points ending at the current hour of day (raw series are 192 points starting at 00:00). */
function window7d(): { startIdx: number; endIdx: number; end: number } {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const endIdx = HOURS + now.getHours();
  return { startIdx: endIdx - HOURS + 1, endIdx, end: now.getTime() };
}

function toPoints(raw: RawSeries): { from: string; to: string; points: Record<string, unknown>[] } {
  const { startIdx, endIdx, end } = window7d();
  const keys = Object.keys(raw.metrics);
  const points: Record<string, unknown>[] = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const p: Record<string, unknown> = { ts: new Date(end - (endIdx - i) * 3_600_000).toISOString() };
    for (const k of keys) p[k] = raw.metrics[k][i];
    points.push(p);
  }
  return { from: points[0]['ts'] as string, to: points[points.length - 1]['ts'] as string, points };
}

const FAMILIES: readonly SensorFamily[] = ['water', 'electricity', 'fertilizer'];
const ID_RE = /^[A-Z]{1,3}-\d{3,4}$/;

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url.split('?')[0];
  if (!url.startsWith(MOCK_API + '/')) return next(req);

  const auth = inject(AuthService);
  if (!auth.hasValidSession()) return fail(401, 'Session expired — please sign in again.', req.url);

  const path = url.slice(MOCK_API.length + 1).split('/');
  const fieldId = req.params.get('fieldId');
  if (fieldId !== null && !ID_RE.test(fieldId)) return fail(400, 'Invalid fieldId', req.url);

  // Role check for every write: the viewer account is read-only.
  if (req.method !== 'GET' && !auth.canWrite()) {
    return fail(403, 'Read-only account: this action requires the admin role.', req.url);
  }

  const farms$ = loadFile<Farm[]>('farms', next);

  // GET /farms
  if (req.method === 'GET' && path[0] === 'farms' && path.length === 1) {
    return farms$.pipe(switchMap((f) => ok(f)));
  }

  // /devices
  if (path[0] === 'devices') {
    const devices$: Observable<Device[]> = devices
      ? of(devices)
      : loadFile<Device[]>('devices', next).pipe(map((d) => (devices ??= d.map((x) => ({ ...x })))));
    if (req.method === 'GET' && path.length === 1) {
      return devices$.pipe(switchMap((d) => ok(fieldId ? d.filter((x) => x.fieldId === fieldId) : d)));
    }
    if (req.method === 'PATCH' && path.length === 2) {
      const id = decodeURIComponent(path[1]);
      const body = req.body as { on?: unknown } | null;
      const on = body?.on;
      if (!ID_RE.test(id) || typeof on !== 'boolean') return fail(400, 'Invalid request', req.url);
      return devices$.pipe(
        switchMap((list) => {
          const dev = list.find((d) => d.id === id);
          if (!dev) return fail(404, 'Device not found', req.url);
          dev.on = on;
          dev.updatedAt = new Date().toISOString();
          dev.updatedBy = auth.session()?.username;
          return ok({ ...dev });
        })
      );
    }
  }

  // /alerts
  if (path[0] === 'alerts') {
    const alerts$: Observable<FarmAlert[]> = alerts
      ? of(alerts)
      : loadFile<RawAlert[]>('alerts', next).pipe(
          map(
            (raw) =>
              (alerts ??= raw.map(({ hoursAgo, ...a }) => ({
                ...a,
                raisedAt: new Date(Date.now() - hoursAgo * 3_600_000 - 7 * 60_000).toISOString(),
              })))
          )
        );
    if (req.method === 'GET' && path.length === 1) {
      return alerts$.pipe(switchMap((a) => ok(fieldId ? a.filter((x) => x.fieldId === fieldId) : a)));
    }
    if (req.method === 'PATCH' && path.length === 2) {
      const id = decodeURIComponent(path[1]);
      const body = req.body as { acknowledged?: unknown } | null;
      if (!ID_RE.test(id) || body?.acknowledged !== true) return fail(400, 'Invalid request', req.url);
      return alerts$.pipe(
        switchMap((list) => {
          const al = list.find((a) => a.id === id);
          if (!al) return fail(404, 'Alert not found', req.url);
          al.acknowledged = true;
          al.acknowledgedBy = auth.session()?.username;
          return ok({ ...al });
        })
      );
    }
  }

  // GET /sensors/:family?fieldId=
  if (req.method === 'GET' && path[0] === 'sensors' && path.length === 2) {
    const family = path[1] as SensorFamily;
    if (!FAMILIES.includes(family)) return fail(404, 'Unknown sensor family', req.url);
    if (!fieldId) return fail(400, 'fieldId is required', req.url);
    return farms$.pipe(
      switchMap((farms) => {
        if (!farms.some((f) => f.fields.some((x) => x.id === fieldId))) return fail(404, 'Field not found', req.url);
        return loadFile<RawSeries[]>(`sensors-${family}`, next).pipe(
          switchMap((all) => {
            const raw = all.find((s) => s.fieldId === fieldId);
            if (!raw) return fail(404, 'No data for field', req.url);
            const series = toPoints(raw);
            // Keep the latest reading consistent with the live (in-memory) device state.
            if (family !== 'electricity') {
              const kind = family === 'water' ? 'pump' : 'doser';
              const dev = devices?.find((d) => d.fieldId === fieldId && d.kind === kind);
              if (dev) series.points[series.points.length - 1][family === 'water' ? 'isPumpOn' : 'isFertilizerOn'] = dev.on;
            }
            return ok({ fieldId, intervalMinutes: raw.intervalMinutes, ...series });
          })
        );
      })
    );
  }

  return fail(404, 'Not found', req.url);
};
