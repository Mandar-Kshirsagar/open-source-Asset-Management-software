import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AssetHistory, CreateAssetHistory } from '../models/asset-history.model';

@Injectable({
  providedIn: 'root'
})
export class AssetHistoryService {
  private apiUrl = `${environment.apiUrl}/assethistory`;

  constructor(private http: HttpClient) { }

  getAllAssetHistory(assetId?: number, userId?: number): Observable<AssetHistory[]> {
    let params = new HttpParams();
    
    if (assetId) {
      params = params.set('assetId', assetId.toString());
    }
    
    if (userId) {
      params = params.set('userId', userId.toString());
    }

    return this.http.get<AssetHistory[]>(this.apiUrl, { params });
  }

  getAssetHistoryById(id: number): Observable<AssetHistory> {
    return this.http.get<AssetHistory>(`${this.apiUrl}/${id}`);
  }

  getAssetHistoryByAsset(assetId: number): Observable<AssetHistory[]> {
    return this.http.get<AssetHistory[]>(`${this.apiUrl}/asset/${assetId}`);
  }

  createAssetHistory(history: CreateAssetHistory): Observable<AssetHistory> {
    return this.http.post<AssetHistory>(this.apiUrl, history);
  }
} 