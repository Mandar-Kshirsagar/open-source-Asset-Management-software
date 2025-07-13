import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If already authenticated and have a valid token, allow
  if (authService.hasValidToken() && authService.isAuthenticated()) {
    return true;
  }

  // If we have a token, try to refresh user data from the backend
  const token = authService.getToken();
  if (token) {
    return authService.getCurrentUserFromServer().pipe(
      map(user => {
        if (user) {
          authService.storeUser(user);
          return true;
        } else {
          router.navigate(['/login']);
          return false;
        }
      }),
      catchError(() => {
        authService.logout();
        router.navigate(['/login']);
        return of(false);
      })
    );
  }

  // No token, redirect to login
  router.navigate(['/login']);
  return false;
}; 