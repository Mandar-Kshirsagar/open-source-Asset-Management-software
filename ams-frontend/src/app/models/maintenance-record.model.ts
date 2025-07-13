import { User } from './user.model';

export interface MaintenanceRecord {
  id: number;
  assetId: number;
  assignedToUserId?: number;
  type: string;
  title: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  status: string;
  notes?: string;
  cost?: number;
  performedBy?: string;
  createdAt: string;
  lastUpdatedAt?: string;
  assignedToUser?: User;
}

export interface CreateMaintenanceRecord {
  assetId: number;
  assignedToUserId?: number;
  type: string;
  title: string;
  description: string;
  scheduledDate: string;
  notes?: string;
}

export interface UpdateMaintenanceRecord {
  assignedToUserId?: number;
  type: string;
  title: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  status: string;
  notes?: string;
  cost?: number;
  performedBy?: string;
} 