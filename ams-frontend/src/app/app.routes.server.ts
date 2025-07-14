import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Server
  },
  {
    path: 'assets',
    renderMode: RenderMode.Server
  },
  {
    path: 'assets/new',
    renderMode: RenderMode.Server
  },
  {
    path: 'assets/:id',
    renderMode: RenderMode.Server // Use server rendering for parameterized routes
  },
  {
    path: 'assets/:id/edit',
    renderMode: RenderMode.Server
  },
  {
    path: 'users',
    renderMode: RenderMode.Server
  },
  {
    path: 'reports',
    renderMode: RenderMode.Server
  },
  {
    path: 'settings',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
