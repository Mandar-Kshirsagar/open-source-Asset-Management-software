import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // <-- Add this import
import { environment } from '../../environments/environment';
import { Asset, CreateAsset, UpdateAsset, AssetFilter } from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private apiUrl = `${environment.apiUrl}/assets`;

  constructor(private http: HttpClient) { }

  getAllAssets(filter?: AssetFilter): Observable<Asset[]> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.searchTerm) {
        params = params.set('searchTerm', filter.searchTerm);
      }
      if (filter.category) {
        params = params.set('category', filter.category);
      }
      if (filter.status) {
        params = params.set('status', filter.status);
      }
      if (filter.location) {
        params = params.set('location', filter.location);
      }
      if (filter.assignedToUserId) {
        params = params.set('assignedToUserId', filter.assignedToUserId.toString());
      }
      if (filter.page) {
        params = params.set('page', filter.page.toString());
      }
      if (filter.pageSize) {
        params = params.set('pageSize', filter.pageSize.toString());
      }
    }

    // Fix: extract the 'data' property from the paginated response (handle both camelCase and PascalCase)
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => response.data || response.Data || [])
    );
  }

  getAssetById(id: number): Observable<Asset> {
    return this.http.get<Asset>(`${this.apiUrl}/${id}`);
  }

  createAsset(asset: CreateAsset): Observable<Asset> {
    return this.http.post<Asset>(this.apiUrl, asset);
  }

  updateAsset(id: number, asset: UpdateAsset): Observable<Asset> {
    return this.http.put<Asset>(`${this.apiUrl}/${id}`, asset);
  }

  deleteAsset(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  assignAsset(assetId: number, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${assetId}/assign`, userId);
  }

  unassignAsset(assetId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${assetId}/unassign`, {});
  }

  getAssetCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  getAssetLocations(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/locations`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard-stats`);
  }
} 