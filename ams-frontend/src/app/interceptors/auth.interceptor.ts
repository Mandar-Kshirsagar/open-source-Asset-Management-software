import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

// Self-contained interceptor that doesn't inject AuthService
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip interceptor during SSR
  if (typeof window === 'undefined') {
    return next(req);
  }
  
  const router = inject(Router);
  
  // Get token directly from localStorage to avoid circular dependency
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token is invalid or expired - handle logout directly
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}; 