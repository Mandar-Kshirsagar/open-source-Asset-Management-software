import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MaintenanceRecord, CreateMaintenanceRecord, UpdateMaintenanceRecord } from '../models/maintenance-record.model';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private apiUrl = `${environment.apiUrl}/maintenance`;

  constructor(private http: HttpClient) { }

  getAllMaintenanceRecords(assetId?: number, status?: string, type?: string): Observable<MaintenanceRecord[]> {
    let params = new HttpParams();
    
    if (assetId) {
      params = params.set('assetId', assetId.toString());
    }
    
    if (status) {
      params = params.set('status', status);
    }
    
    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<MaintenanceRecord[]>(this.apiUrl, { params });
  }

  getMaintenanceRecordById(id: number): Observable<MaintenanceRecord> {
    return this.http.get<MaintenanceRecord>(`${this.apiUrl}/${id}`);
  }

  getMaintenanceRecordsByAsset(assetId: number): Observable<MaintenanceRecord[]> {
    return this.http.get<MaintenanceRecord[]>(`${this.apiUrl}/asset/${assetId}`);
  }

  getUpcomingMaintenance(days: number = 30): Observable<MaintenanceRecord[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<MaintenanceRecord[]>(`${this.apiUrl}/upcoming`, { params });
  }

  createMaintenanceRecord(record: CreateMaintenanceRecord): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(this.apiUrl, record);
  }

  updateMaintenanceRecord(id: number, record: UpdateMaintenanceRecord): Observable<MaintenanceRecord> {
    return this.http.put<MaintenanceRecord>(`${this.apiUrl}/${id}`, record);
  }

  deleteMaintenanceRecord(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 