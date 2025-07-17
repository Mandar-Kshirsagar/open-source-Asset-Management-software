import { ApplicationConfig, ErrorHandler, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadingStrategy, Route } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch, withNoXsrfProtection } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';

import { GlobalErrorHandler } from './core/global-error-handler';

// Selective preloading strategy for better performance
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Preload high-priority routes that users are likely to visit
    const highPriorityRoutes = ['dashboard', 'assets'];
    
    if (route.path && highPriorityRoutes.includes(route.path)) {
      return load();
    } else {
      return of(null);
    }
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideZonelessChangeDetection(),
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
    provideHttpClient(
      withInterceptors([AuthInterceptor]),
      withFetch()
    ),
    provideAnimations(),
    provideClientHydration(),
    provideNativeDateAdapter()
  ]
};
