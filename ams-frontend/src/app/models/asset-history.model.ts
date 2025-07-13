import { User } from './user.model';

export interface AssetHistory {
  id: number;
  assetId: number;
  userId?: number;
  action: string;
  description: string;
  timestamp: string;
  previousStatus: string;
  newStatus: string;
  previousLocation: string;
  newLocation: string;
  user?: User;
}

export interface CreateAssetHistory {
  assetId: number;
  userId?: number;
  action: string;
  description: string;
  previousStatus?: string;
  newStatus?: string;
  previousLocation?: string;
  newLocation?: string;
} 