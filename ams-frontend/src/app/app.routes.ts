import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'assets', loadComponent: () => import('./pages/assets/assets.component').then(m => m.AssetsComponent) },
      { path: 'assets/new', loadComponent: () => import('./pages/assets/asset-form/asset-form.component').then(m => m.AssetFormComponent) },
      { path: 'assets/:id', loadComponent: () => import('./pages/assets/asset-detail/asset-detail.component').then(m => m.AssetDetailComponent) },
      { path: 'assets/:id/edit', loadComponent: () => import('./pages/assets/asset-form/asset-form.component').then(m => m.AssetFormComponent) },
      { path: 'users', loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent) },
      { path: 'reports', loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
      { path: '**', redirectTo: '/dashboard' }
    ]
  }
];
