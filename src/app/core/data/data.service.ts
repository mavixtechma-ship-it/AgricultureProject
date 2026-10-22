import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { MOCK_API } from './mock-backend.interceptor';
import { Device, Farm, FarmAlert, Field, SensorFamily, SensorPointMap, SensorSeries } from './models';

const FIELD_KEY = 'agrisense.field';

/** Single entry point for dashboard data. All calls go to the virtual /mock-api answered by the mock backend. */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);

  readonly farms = signal<Farm[]>([]);
  readonly fields = computed<Field[]>(() =>
    this.farms().flatMap((farm) => farm.fields.map((f) => ({ ...f, farmId: farm.id })))
  );
  readonly selectedFieldId = signal<string>(this.readField());
  readonly selectedField = computed(() => this.fields().find((f) => f.id === this.selectedFieldId()) ?? null);
  readonly selectedFarm = computed(() => this.farms().find((f) => f.id === this.selectedField()?.farmId) ?? null);
  /** Unacknowledged alerts across all fields (sidebar badge). */
  readonly openAlerts = signal(0);

  loadFarms(): Observable<Farm[]> {
    return this.http.get<Farm[]>(`${MOCK_API}/farms`).pipe(
      tap((farms) => {
        this.farms.set(farms);
        const ids = farms.flatMap((f) => f.fields.map((x) => x.id));
        if (ids.length && !ids.includes(this.selectedFieldId())) this.selectField(ids[0]);
      })
    );
  }

  selectField(id: string): void {
    this.selectedFieldId.set(id);
    try {
      localStorage.setItem(FIELD_KEY, id);
    } catch {
      /* storage unavailable — selection is kept in memory */
    }
  }

  fieldName(id: string): string {
    return this.fields().find((f) => f.id === id)?.name ?? id;
  }

  sensors<F extends SensorFamily>(family: F, fieldId: string): Observable<SensorSeries<SensorPointMap[F]>> {
    return this.http.get<SensorSeries<SensorPointMap[F]>>(`${MOCK_API}/sensors/${family}`, {
      params: new HttpParams().set('fieldId', fieldId),
    });
  }

  devices(fieldId?: string): Observable<Device[]> {
    const params = fieldId ? new HttpParams().set('fieldId', fieldId) : undefined;
    return this.http.get<Device[]>(`${MOCK_API}/devices`, { params });
  }

  setDevice(id: string, on: boolean): Observable<Device> {
    return this.http.patch<Device>(`${MOCK_API}/devices/${encodeURIComponent(id)}`, { on });
  }

  alerts(fieldId?: string): Observable<FarmAlert[]> {
    const params = fieldId ? new HttpParams().set('fieldId', fieldId) : undefined;
    return this.http.get<FarmAlert[]>(`${MOCK_API}/alerts`, { params });
  }

  acknowledgeAlert(id: string): Observable<FarmAlert> {
    return this.http.patch<FarmAlert>(`${MOCK_API}/alerts/${encodeURIComponent(id)}`, { acknowledged: true });
  }

  private readField(): string {
    try {
      return localStorage.getItem(FIELD_KEY) ?? '';
    } catch {
      return '';
    }
  }
}
