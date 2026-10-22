import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

const THEME_KEY = 'agrisense.theme';
export const DARK_CLASS = 'app-dark';

/** Light/dark theme. Applies `.app-dark` on <html> (PrimeNG darkModeSelector + Tailwind `dark:`), persisted per browser. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly dark = signal<boolean>(this.initial());

  constructor() {
    this.apply(this.dark());
  }

  toggle(): void {
    this.set(!this.dark());
  }

  set(dark: boolean): void {
    this.apply(dark); // apply the class first so CSS variables are current when dependants recompute
    this.dark.set(dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    } catch {
      /* storage unavailable */
    }
  }

  /** Reads a CSS custom property from :root (used to theme charts from the design tokens). */
  token(name: string): string {
    return getComputedStyle(this.doc.documentElement).getPropertyValue(name).trim();
  }

  private apply(dark: boolean): void {
    this.doc.documentElement.classList.toggle(DARK_CLASS, dark);
  }

  private initial(): boolean {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved === 'dark';
    } catch {
      /* ignore */
    }
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
