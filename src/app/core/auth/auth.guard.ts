import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Allows navigation only with a valid, unexpired session; otherwise redirects to /login with a safe returnUrl. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.hasValidSession()) return true;
  auth.logout();
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Signed-in users skip the login page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.hasValidSession() ? inject(Router).createUrlTree(['/app']) : true;
};

/** Only internal dashboard paths are accepted as post-login redirects (prevents open redirects). */
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/app') || value.startsWith('//') || value.includes(String.fromCharCode(92))) return '/app';
  return value;
}
