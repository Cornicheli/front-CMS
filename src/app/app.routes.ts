import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('@features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/contents/layout/layout.component').then((m) => m.LayoutComponent),
  },
  {
    path: 'monitor',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/monitor/monitor.component').then((m) => m.MonitorComponent),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
