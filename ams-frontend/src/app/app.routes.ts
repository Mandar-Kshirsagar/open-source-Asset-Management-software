import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'assets', 
    loadComponent: () => import('./pages/assets/assets.component').then(m => m.AssetsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'assets/new', 
    loadComponent: () => import('./pages/assets/asset-form/asset-form.component').then(m => m.AssetFormComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'assets/:id', 
    loadComponent: () => import('./pages/assets/asset-detail/asset-detail.component').then(m => m.AssetDetailComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'assets/:id/edit', 
    loadComponent: () => import('./pages/assets/asset-form/asset-form.component').then(m => m.AssetFormComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'users', 
    loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'reports', 
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
