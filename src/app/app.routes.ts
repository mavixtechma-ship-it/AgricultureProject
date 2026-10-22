import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'AgriSense — field intelligence for growers',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    title: 'Sign in · AgriSense',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        title: 'Overview · AgriSense',
        data: { heading: 'Overview' },
        loadComponent: () => import('./features/overview/overview.component').then((m) => m.OverviewComponent),
      },
      {
        path: 'irrigation',
        title: 'Irrigation · AgriSense',
        data: { heading: 'Irrigation' },
        loadComponent: () => import('./features/irrigation/irrigation.component').then((m) => m.IrrigationComponent),
      },
      {
        path: 'energy',
        title: 'Energy & climate · AgriSense',
        data: { heading: 'Energy & climate' },
        loadComponent: () => import('./features/energy/energy.component').then((m) => m.EnergyComponent),
      },
      {
        path: 'nutrients',
        title: 'Nutrients · AgriSense',
        data: { heading: 'Nutrients' },
        loadComponent: () => import('./features/nutrients/nutrients.component').then((m) => m.NutrientsComponent),
      },
      {
        path: 'alerts',
        title: 'Alerts · AgriSense',
        data: { heading: 'Alerts' },
        loadComponent: () => import('./features/alerts/alerts.component').then((m) => m.AlertsComponent),
      },
    ],
  },
  // Legacy paths
  { path: 'dashboard', redirectTo: 'app' },
  { path: 'register', redirectTo: 'login' },
  { path: '**', redirectTo: '' },
];
