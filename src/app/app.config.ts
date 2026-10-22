import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { mockBackendInterceptor } from './core/data/mock-backend.interceptor';
import { AgriSensePreset } from './core/theme/agrisense.preset';
import { DARK_CLASS } from './core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
    ),
    // No JSONP, no global withCredentials: every /mock-api call is answered locally by the interceptor.
    provideHttpClient(withInterceptors([mockBackendInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: false,
      theme: {
        preset: AgriSensePreset,
        options: {
          darkModeSelector: '.' + DARK_CLASS,
          cssLayer: { name: 'primeng', order: 'tailwind-base, primeng, tailwind-utilities' },
        },
      },
    }),
  ],
};
