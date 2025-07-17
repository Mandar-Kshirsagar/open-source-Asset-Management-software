import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedMaterialModule } from '../../shared/material.module';
import { HeaderComponent } from '../../shared/header/header.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';
import { AuthService } from '../../services/auth.service';
import { AssetService } from '../../services/asset.service';
import { User } from '../../models/user.model';
import { Asset } from '../../models/asset.model';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule
  ],
  template: `
    <div class="dashboard-container">
      <h1 class="page-title">Dashboard</h1>
      <div class="dashboard-content">
            <h1>Dashboard</h1>
            <!-- Loading State -->
            <div *ngIf="loading" class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Loading dashboard data...</p>
            </div>
            <!-- Error State -->
            <div *ngIf="error" class="error-container">
              <mat-icon color="warn">error</mat-icon>
              <h3>Error Loading Dashboard</h3>
              <p>{{ error }}</p>
              <button mat-raised-button color="primary" (click)="loadDashboardData()">
                <mat-icon>refresh</mat-icon>
                Retry
              </button>
            </div>
            <!-- Dashboard Content -->
            <div *ngIf="!loading && !error">
              <div class="stats-grid">
                <mat-card>
                  <mat-card-content>
                    <div class="stat-item">
                      <mat-icon>inventory</mat-icon>
                      <div>
                        <h3>{{ totalAssets }}</h3>
                        <p>Total Assets</p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                <mat-card>
                  <mat-card-content>
                    <div class="stat-item">
                      <mat-icon>check_circle</mat-icon>
                      <div>
                        <h3>{{ availableAssets }}</h3>
                        <p>Available</p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                <mat-card>
                  <mat-card-content>
                    <div class="stat-item">
                      <mat-icon>person</mat-icon>
                      <div>
                        <h3>{{ assignedAssets }}</h3>
                        <p>Assigned</p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
                <mat-card>
                  <mat-card-content>
                    <div class="stat-item">
                      <mat-icon>build</mat-icon>
                      <div>
                        <h3>{{ maintenanceAssets }}</h3>
                        <p>In Maintenance</p>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
              <div class="recent-assets">
                <h2>Recent Assets</h2>
                <div *ngIf="recentAssets.length === 0" class="no-assets">
                  <mat-icon>inventory_2</mat-icon>
                  <p>No assets found. <a routerLink="/assets/new">Add your first asset</a></p>
                </div>
                <div class="assets-grid" *ngIf="recentAssets.length > 0">
                  <mat-card *ngFor="let asset of recentAssets" class="asset-card">
                    <mat-card-header>
                      <mat-card-title>{{ asset.name }}</mat-card-title>
                      <mat-card-subtitle>{{ asset.assetTag }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p><strong>Category:</strong> {{ asset.category }}</p>
                      <p><strong>Status:</strong> 
                        <span class="status-badge" [class]="'status-' + asset.status.toLowerCase()">
                          {{ asset.status }}
                        </span>
                      </p>
                      <p><strong>Location:</strong> {{ asset.location }}</p>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-button [routerLink]="['/assets', asset.id]">View Details</button>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </div>
            </div>
          </div>
    </div>
  `,
  styles: [`
    .dashboard-root {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f5f5f5;
    }
    .dashboard-sidenav-container {
      flex: 1;
      display: flex;
      height: calc(100vh - 112px); /* header + breadcrumb height */
      background: #f5f5f5;
    }
    .dashboard-sidenav {
      width: 220px;
      background: #fff;
      border-right: 1px solid #e0e0e0;
      padding-top: 16px;
    }
    .dashboard-sidenav .mat-icon {
      margin-right: 12px;
      color: #3f51b5;
    }
    .dashboard-sidenav .active {
      background: #e3f2fd !important;
      color: #1976d2 !important;
    }
    .dashboard-content {
      flex: 1;
      padding: 24px;
      overflow: auto;
      background: #f5f5f5;
    }
    .dashboard-content h1 {
      margin: 0 0 24px 0;
      color: #333;
      font-size: 28px;
      font-weight: 500;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 20px;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 20px;
      text-align: center;
    }

    .error-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .stat-item mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
    }

    .stat-item h3 {
      margin: 0;
      font-size: 32px;
      font-weight: 500;
      color: #333;
    }

    .stat-item p {
      margin: 0;
      color: #666;
    }

    .recent-assets h2 {
      margin-bottom: 20px;
      color: #333;
    }

    .no-assets {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 20px;
      text-align: center;
      color: #666;
    }

    .no-assets mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    .no-assets a {
      color: #1976d2;
      text-decoration: none;
    }

    .no-assets a:hover {
      text-decoration: underline;
    }

    .assets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .asset-card {
      height: fit-content;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-available {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-assigned {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .status-maintenance {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .status-retired {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .active {
      background-color: rgba(25, 118, 210, 0.1);
    }

    mat-nav-list a {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    @media (max-width: 900px) {
      .dashboard-sidenav {
        width: 60px;
        padding-top: 8px;
      }
      .dashboard-sidenav .mat-list-item span {
        display: none;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  totalAssets = 0;
  availableAssets = 0;
  assignedAssets = 0;
  maintenanceAssets = 0;
  recentAssets: Asset[] = [];
  loading = false;
  error: string | null = null;
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', icon: 'dashboard' }
  ];

  constructor(
    private authService: AuthService,
    private assetService: AssetService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;
    
    console.log('Loading dashboard stats...');
    
    this.assetService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('Dashboard stats loaded:', stats);
        this.totalAssets = stats.totalAssets;
        this.availableAssets = stats.availableAssets;
        this.assignedAssets = stats.assignedAssets;
        this.maintenanceAssets = stats.maintenanceAssets;
        this.recentAssets = stats.recentAssets || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        this.error = 'Failed to load dashboard data. Please check your connection and try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToNewAsset(): void {
    // Navigation will be handled by router
    window.location.href = '/assets/new';
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }
}