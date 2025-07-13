import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Only run initialization in browser environment
    if (typeof window !== 'undefined') {
      // Load stored user immediately
      this.loadStoredUser();
      
      // Don't make HTTP calls during initialization to avoid circular dependency
      // The user can manually refresh or navigate to trigger data loading
    }
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, loginRequest)
      .pipe(
        tap(response => {
          this.storeToken(response.token);
          this.storeUser(response.user);
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  logout(): void {
    this.removeToken();
    this.removeUser();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && window.localStorage !== undefined;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role || user?.role === 'Admin';
  }

  // Method to check if we have a valid token and user data
  hasValidToken(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Method to validate token with backend
  validateToken(): Observable<boolean> {
    return this.http.get<{ valid: boolean }>(`${environment.apiUrl}/auth/validate`)
      .pipe(
        tap(response => {
          if (!response.valid) {
            this.logout();
          }
        }),
        map(response => response.valid)
      );
  }

  // Method to get current user from backend
  getCurrentUserFromServer(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`);
  }

  // Method to initialize authentication state
  initializeAuth(): void {
    this.loadStoredUser();
  }

  // Method to refresh user data from server
  refreshUserData(): void {
    const token = this.getToken();
    if (token) {
      this.getCurrentUserFromServer().subscribe({
        next: (user: User) => {
          this.storeUser(user);
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        },
        error: (error: any) => {
          console.error('Error refreshing user data:', error);
          this.logout();
        }
      });
    }
  }

  // Method to refresh user data silently (without logout on error)
  refreshUserDataSilently(): void {
    const token = this.getToken();
    if (token) {
      this.getCurrentUserFromServer().subscribe({
        next: (user: User) => {
          this.storeUser(user);
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        },
        error: (error: any) => {
          console.error('Error refreshing user data silently:', error);
          // Don't logout on network errors during initialization
          // Just keep the existing state
        }
      });
    }
  }

  private storeToken(token: string): void {
    if (this.isBrowser()) {
      localStorage.setItem('auth_token', token);
    }
  }

  public storeUser(user: User): void {
    if (this.isBrowser()) {
      localStorage.setItem('current_user', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  private removeToken(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('auth_token');
    }
  }

  private removeUser(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('current_user');
    }
  }

  private loadStoredUser(): void {
    if (!this.isBrowser()) {
      return;
    }
    
    const token = this.getToken();
    const userStr = localStorage.getItem('current_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.logout();
      }
    } else {
      // Clear any invalid state
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
    }
  }
} 