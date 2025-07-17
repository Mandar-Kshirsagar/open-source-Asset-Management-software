import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AppSettings {
  companyName: string;
  companyLogoUrl: string;
  defaultTheme: string;
  defaultLanguage: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private apiUrl = `${environment.apiUrl}/AppSettings`;
  private _appSettings = new BehaviorSubject<AppSettings | null>(null);
  public readonly appSettings$ = this._appSettings.asObservable();

  constructor(private http: HttpClient) { 
    this.loadAppSettings();
  }

  private loadAppSettings(): void {
    this.http.get<AppSettings>(this.apiUrl).subscribe({
      next: (settings) => {
        this._appSettings.next(settings);
      },
      error: (err) => {
        console.error('Error loading app settings:', err);
        const errorMessage = err.error?.detail || 'Failed to load app settings.';
        console.error(errorMessage);
        // Provide default settings if loading fails
        this._appSettings.next({
          companyName: 'Asset Management System',
          companyLogoUrl: '/images/default_logo.png',
          defaultTheme: 'light',
          defaultLanguage: 'en-US',
        });
      }
    });
  }

  getAppSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(this.apiUrl).pipe(
      tap(settings => this._appSettings.next(settings))
    );
  }

  updateAppSettings(settings: Partial<AppSettings>): Observable<void> {
    // Convert to Dictionary<string, string> as expected by the backend
    const settingsDict: { [key: string]: string } = {};
    for (const key in settings) {
      if (settings.hasOwnProperty(key)) {
        settingsDict[key] = (settings as any)[key].toString();
      }
    }

    return this.http.put<void>(this.apiUrl, settingsDict).pipe(
      tap(() => this.loadAppSettings()), // Reload settings after successful update
      catchError(err => {
        const errorMessage = err.error?.detail || 'Failed to update app settings.';
        console.error('Error updating app settings:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  uploadCompanyLogo(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload-logo`, formData, { responseType: 'text' }).pipe(
      tap((logoUrl: string) => {
        const currentSettings = this._appSettings.value;
        if (currentSettings) {
          this._appSettings.next({ ...currentSettings, companyLogoUrl: logoUrl });
        }
      }),
      catchError(err => {
        const errorMessage = err.error?.detail || 'Failed to upload company logo.';
        console.error('Error uploading company logo:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
