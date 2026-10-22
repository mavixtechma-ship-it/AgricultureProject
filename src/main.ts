import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(() => {
  // Keep production consoles free of internals; the page shows the static fallback in index.html.
  document.getElementById('boot-error')?.removeAttribute('hidden');
});
