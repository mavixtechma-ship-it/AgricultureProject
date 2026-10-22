import { HttpErrorResponse } from '@angular/common/http';
import { Signal, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, filter, map, of, startWith, switchMap } from 'rxjs';
import { DataService } from '../../core/data/data.service';

export interface Loadable<T> {
  status: 'loading' | 'ok' | 'error';
  data: T | null;
  error: string | null;
}

const LOADING = { status: 'loading', data: null, error: null } as const;

/** Maps HTTP errors to short, user-safe messages (never renders raw server bodies). */
export function errorMessage(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 401) return 'Your session has expired. Please sign in again.';
    if (e.status === 403) return 'Read-only account: this action requires the admin role.';
    if (e.status === 404) return 'The requested data was not found.';
    if (e.status === 400) return 'The request was rejected as invalid.';
  }
  return 'Something went wrong while loading data.';
}

export function toLoadable<T>(source: Observable<T>): Observable<Loadable<T>> {
  return source.pipe(
    map((data): Loadable<T> => ({ status: 'ok', data, error: null })),
    catchError((e) => of<Loadable<T>>({ status: 'error', data: null, error: errorMessage(e) })),
    startWith<Loadable<T>>(LOADING)
  );
}

/**
 * Re-fetches whenever the selected field (or the optional refresh counter) changes.
 * Must be called in an injection context (component field initializer).
 */
export function fieldResource<T>(fetch: (fieldId: string) => Observable<T>, refresh?: Signal<number>): Signal<Loadable<T>> {
  const data = inject(DataService);
  // Depends on fields() too, so the first fetch fires as soon as the farm list has loaded.
  const key = computed(() => {
    const id = data.selectedFieldId();
    return { id, valid: data.fields().some((f) => f.id === id), r: refresh ? refresh() : 0 };
  });
  return toSignal(
    toObservable(key).pipe(
      filter((k) => k.valid),
      switchMap((k) => toLoadable(fetch(k.id)))
    ),
    { initialValue: LOADING as Loadable<T> }
  );
}
