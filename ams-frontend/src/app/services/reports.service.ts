import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }

  getAssetsByCategory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assets-by-category`);
  }

  getAssetsByLocation(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assets-by-location`);
  }

  getMaintenanceSummary(days: number = 30): Observable<any> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any>(`${this.apiUrl}/maintenance-summary`, { params });
  }

  getUserAssignments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user-assignments`);
  }

  getAssetValueTrend(months: number = 12): Observable<any[]> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<any[]>(`${this.apiUrl}/asset-value-trend`, { params });
  }

  getActivityLog(days: number = 30, action?: string): Observable<any[]> {
    let params = new HttpParams().set('days', days.toString());
    if (action) {
      params = params.set('action', action);
    }
    return this.http.get<any[]>(`${this.apiUrl}/activity-log`, { params });
  }
} 