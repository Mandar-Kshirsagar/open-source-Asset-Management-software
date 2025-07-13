export interface Asset {
  id: number;
  name: string;
  description: string;
  assetTag: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchasePrice: number;
  purchaseDate: string;
  warrantyExpiryDate?: string;
  status: string;
  location: string;
  condition: string;
  createdAt: string;
  lastUpdatedAt?: string;
  assignedToUserId?: number;
  assignedToUser?: User;
}

export interface CreateAsset {
  name: string;
  description: string;
  assetTag: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchasePrice: number;
  purchaseDate: string;
  warrantyExpiryDate?: string;
  location: string;
  condition: string;
}

export interface UpdateAsset {
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchasePrice: number;
  purchaseDate: string;
  warrantyExpiryDate?: string;
  status: string;
  location: string;
  condition: string;
  assignedToUserId?: number;
}

export interface AssetFilter {
  searchTerm?: string;
  category?: string;
  status?: string;
  location?: string;
  assignedToUserId?: number;
  page: number;
  pageSize: number;
}

// Import User interface
import { User } from './user.model'; 