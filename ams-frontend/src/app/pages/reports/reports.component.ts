import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedMaterialModule } from '../../shared/material.module';
import { HeaderComponent } from '../../shared/header/header.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../services/reports.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule,
    FormsModule
  ],
  template: `
    <div class="reports-container">
      <div class="reports-content">
        <h1 class="page-title">Reports & Analytics</h1>

            <mat-tab-group>
              <!-- Dashboard Overview Tab -->
              <mat-tab label="Dashboard Overview">
                <div class="tab-content">
                  <div *ngIf="loading" class="loading-container">
                    <mat-spinner diameter="50"></mat-spinner>
                    <p>Loading dashboard data...</p>
                  </div>

                  <div *ngIf="!loading && dashboardStats" class="dashboard-grid">
                    <!-- Key Metrics -->
                    <mat-card class="metric-card">
                      <mat-card-header>
                        <mat-card-title>Total Assets</mat-card-title>
                        <mat-card-subtitle>All assets in the system</mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="metric-value">{{ dashboardStats.totalAssets }}</div>
                        <div class="metric-breakdown">
                          <div class="metric-item">
                            <span class="label">Assigned:</span>
                            <span class="value">{{ dashboardStats.assignedAssets }}</span>
                          </div>
                          <div class="metric-item">
                            <span class="label">Available:</span>
                            <span class="value">{{ dashboardStats.availableAssets }}</span>
                          </div>
                          <div class="metric-item">
                            <span class="label">Maintenance:</span>
                            <span class="value">{{ dashboardStats.maintenanceAssets }}</span>
                          </div>
                          <div class="metric-item">
                            <span class="label">Retired:</span>
                            <span class="value">{{ dashboardStats.retiredAssets }}</span>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>

                    <mat-card class="metric-card">
                      <mat-card-header>
                        <mat-card-title>Total Value</mat-card-title>
                        <mat-card-subtitle>Combined asset value</mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="metric-value">{{ dashboardStats.totalValue | number:'1.0-0' }}</div>
                      </mat-card-content>
                    </mat-card>

                    <mat-card class="metric-card">
                      <mat-card-header>
                        <mat-card-title>Users</mat-card-title>
                        <mat-card-subtitle>Total system users</mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="metric-value">{{ dashboardStats.totalUsers }}</div>
                      </mat-card-content>
                    </mat-card>

                    <mat-card class="metric-card">
                      <mat-card-header>
                        <mat-card-title>Upcoming Maintenance</mat-card-title>
                        <mat-card-subtitle>Next 30 days</mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="metric-value">{{ dashboardStats.upcomingMaintenance }}</div>
                      </mat-card-content>
                    </mat-card>

                    <!-- Recent Activity -->
                    <mat-card class="activity-card">
                      <mat-card-header>
                        <mat-card-title>Recent Activity</mat-card-title>
                        <mat-card-subtitle>Latest asset changes</mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="activity-list">
                          <div *ngFor="let activity of dashboardStats.recentActivity" class="activity-item">
                            <div class="activity-icon">
                              <mat-icon>event</mat-icon>
                            </div>
                            <div class="activity-details">
                              <div class="activity-action">{{ activity.action }}</div>
                              <div class="activity-asset">{{ activity.AssetName }}</div>
                              <div class="activity-user">{{ activity.UserName }}</div>
                              <div class="activity-time">{{ activity.timestamp | date:'short' }}</div>
                            </div>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
                </div>
              </mat-tab>

              <!-- Asset Analytics Tab -->
              <mat-tab label="Asset Analytics">
                <div class="tab-content">
                  <div class="analytics-grid">
                    <!-- Assets by Category -->
                    <mat-card class="chart-card">
                      <mat-card-header>
                        <mat-card-title>Assets by Category</mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div *ngIf="assetsByCategory.length > 0" class="chart-data">
                          <div *ngFor="let category of assetsByCategory" class="chart-item">
                            <div class="chart-label">{{ category.Category }}</div>
                            <div class="chart-bar">
                              <div class="bar-fill" [style.width.%]="getPercentage(category.Count, getMaxCount(assetsByCategory))"></div>
                            </div>
                            <div class="chart-value">{{ category.Count }} ({{ category.TotalValue | number:'1.0-0' }})</div>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>

                    <!-- Assets by Location -->
                    <mat-card class="chart-card">
                      <mat-card-header>
                        <mat-card-title>Assets by Location</mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <div *ngIf="assetsByLocation.length > 0" class="chart-data">
                          <div *ngFor="let location of assetsByLocation" class="chart-item">
                            <div class="chart-label">{{ location.Location }}</div>
                            <div class="chart-bar">
                              <div class="bar-fill" [style.width.%]="getPercentage(location.Count, getMaxCount(assetsByLocation))"></div>
                            </div>
                            <div class="chart-value">{{ location.Count }} ({{ location.TotalValue | number:'1.0-0' }})</div>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
                </div>
              </mat-tab>

              <!-- Maintenance Reports Tab -->
              <mat-tab label="Maintenance Reports">
                <div class="tab-content">
                  <div class="maintenance-grid">
                    <!-- Maintenance Summary -->
                    <mat-card class="summary-card">
                      <mat-card-header>
                        <mat-card-title>Maintenance Summary</mat-card-title>
                        <mat-card-subtitle>Last 30 days</mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <div *ngIf="maintenanceSummary" class="summary-grid">
                          <div *ngFor="let summary of maintenanceSummary.maintenanceSummary" class="summary-item">
                            <div class="summary-type">{{ summary.Type }}</div>
                            <div class="summary-stats">
                              <div class="stat">
                                <span class="label">Scheduled:</span>
                                <span class="value">{{ summary.TotalScheduled }}</span>
                              </div>
                              <div class="stat">
                                <span class="label">In Progress:</span>
                                <span class="value">{{ summary.TotalInProgress }}</span>
                              </div>
                              <div class="stat">
                                <span class="label">Completed:</span>
                                <span class="value">{{ summary.TotalCompleted }}</span>
                              </div>
                              <div class="stat">
                                <span class="label">Cost:</span>
                                <span class="value">{{ summary.TotalCost | number:'1.0-0' }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>

                    <!-- Upcoming Maintenance -->
                    <mat-card class="upcoming-card">
                      <mat-card-header>
                        <mat-card-title>Upcoming Maintenance</mat-card-title>
                        <mat-card-subtitle>Next 30 days</mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <div *ngIf="maintenanceSummary?.upcomingMaintenance?.length > 0" class="upcoming-list">
                          <div *ngFor="let maintenance of maintenanceSummary.upcomingMaintenance" class="upcoming-item">
                            <div class="maintenance-info">
                              <div class="maintenance-title">{{ maintenance.Title }}</div>
                              <div class="maintenance-asset">{{ maintenance.AssetName }}</div>
                              <div class="maintenance-details">
                                <span class="type">{{ maintenance.Type }}</span>
                                <span class="status">{{ maintenance.Status }}</span>
                                <span class="date">{{ maintenance.ScheduledDate | date:'shortDate' }}</span>
                              </div>
                            </div>
                            <div class="maintenance-assigned">
                              {{ maintenance.AssignedTo }}
                            </div>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
                </div>
              </mat-tab>

              <!-- User Assignments Tab -->
              <mat-tab label="User Assignments">
                <div class="tab-content">
                  <div class="assignments-grid">
                    <div *ngFor="let user of userAssignments" class="assignment-card">
                      <mat-card>
                        <mat-card-header>
                          <mat-card-title>{{ user.UserName }}</mat-card-title>
                          <mat-card-subtitle>{{ user.Email }} - {{ user.Role }}</mat-card-subtitle>
                        </mat-card-header>
                        <mat-card-content>
                          <div class="assignment-stats">
                            <div class="stat">
                              <span class="label">Assigned Assets:</span>
                              <span class="value">{{ user.AssignedAssetsCount }}</span>
                            </div>
                            <div class="stat">
                              <span class="label">Total Value:</span>
                              <span class="value">{{ user.AssignedAssetsValue | number:'1.0-0' }}</span>
                            </div>
                          </div>
                          <div *ngIf="user.AssignedAssets.length > 0" class="assigned-assets">
                            <h4>Assigned Assets:</h4>
                            <div *ngFor="let asset of user.AssignedAssets" class="asset-item">
                              <span class="asset-name">{{ asset.Name }}</span>
                              <span class="asset-tag">{{ asset.AssetTag }}</span>
                              <span class="asset-category">{{ asset.Category }}</span>
                              <span class="asset-value">{{ asset.PurchasePrice | number:'1.0-0' }}</span>
                            </div>
                          </div>
                        </mat-card-content>
                      </mat-card>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <!-- Activity Log Tab -->
              <mat-tab label="Activity Log">
                <div class="tab-content">
                  <div class="activity-controls">
                    <mat-form-field appearance="outline">
                      <mat-label for="action-filter">Filter by Action</mat-label>
                      <mat-select id="action-filter" [(ngModel)]="selectedAction" (selectionChange)="loadActivityLog()" aria-label="Filter by action">
                        <mat-option value="">All Actions</mat-option>
                        <mat-option value="Assigned">Assigned</mat-option>
                        <mat-option value="Unassigned">Unassigned</mat-option>
                        <mat-option value="Status Changed">Status Changed</mat-option>
                        <mat-option value="Location Changed">Location Changed</mat-option>
                        <mat-option value="Created">Created</mat-option>
                        <mat-option value="Updated">Updated</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="activity-table-container">
                    <table mat-table [dataSource]="activityLog" class="activity-table">
                      <ng-container matColumnDef="timestamp">
                        <th mat-header-cell *matHeaderCellDef>Time</th>
                        <td mat-cell *matCellDef="let activity">{{ activity.Timestamp | date:'short' }}</td>
                      </ng-container>

                      <ng-container matColumnDef="action">
                        <th mat-header-cell *matHeaderCellDef>Action</th>
                        <td mat-cell *matCellDef="let activity">
                          <mat-chip>{{ activity.Action }}</mat-chip>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="asset">
                        <th mat-header-cell *matHeaderCellDef>Asset</th>
                        <td mat-cell *matCellDef="let activity">{{ activity.AssetName }}</td>
                      </ng-container>

                      <ng-container matColumnDef="user">
                        <th mat-header-cell *matHeaderCellDef>User</th>
                        <td mat-cell *matCellDef="let activity">{{ activity.UserName }}</td>
                      </ng-container>

                      <ng-container matColumnDef="description">
                        <th mat-header-cell *matHeaderCellDef>Description</th>
                        <td mat-cell *matCellDef="let activity">{{ activity.Description }}</td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="activityColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: activityColumns;"></tr>
                    </table>
                  </div>
                </div>
              </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }

    .reports-container {
      height: calc(100vh - 64px);
    }

    .sidenav {
      width: 250px;
    }

    .content {
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    .tab-content {
      padding: 20px 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 20px;
      color: #666;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .metric-card {
      text-align: center;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #1976d2;
      margin: 20px 0;
    }

    .metric-breakdown {
      text-align: left;
    }

    .metric-item {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
    }

    .activity-card {
      grid-column: 1 / -1;
    }

    .activity-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon mat-icon {
      color: #666;
    }

    .activity-action {
      font-weight: 500;
      color: #333;
    }

    .activity-asset {
      color: #1976d2;
      font-size: 0.9rem;
    }

    .activity-user {
      color: #666;
      font-size: 0.8rem;
    }

    .activity-time {
      color: #999;
      font-size: 0.8rem;
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    .chart-card {
      height: fit-content;
    }

    .chart-data {
      margin-top: 20px;
    }

    .chart-item {
      display: flex;
      align-items: center;
      gap: 15px;
      margin: 15px 0;
    }

    .chart-label {
      min-width: 120px;
      font-weight: 500;
    }

    .chart-bar {
      flex: 1;
      height: 20px;
      background-color: #f0f0f0;
      border-radius: 10px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background-color: #1976d2;
      transition: width 0.3s ease;
    }

    .chart-value {
      min-width: 100px;
      text-align: right;
      font-size: 0.9rem;
      color: #666;
    }

    .maintenance-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .summary-grid {
      display: grid;
      gap: 15px;
    }

    .summary-item {
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .summary-type {
      font-weight: 500;
      margin-bottom: 10px;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .stat {
      display: flex;
      justify-content: space-between;
    }

    .label {
      color: #666;
    }

    .value {
      font-weight: 500;
    }

    .upcoming-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .upcoming-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .upcoming-item:last-child {
      border-bottom: none;
    }

    .maintenance-title {
      font-weight: 500;
    }

    .maintenance-asset {
      color: #1976d2;
      font-size: 0.9rem;
    }

    .maintenance-details {
      display: flex;
      gap: 15px;
      margin-top: 5px;
    }

    .maintenance-details span {
      font-size: 0.8rem;
      color: #666;
    }

    .assignments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }

    .assignment-stats {
      display: grid;
      gap: 10px;
      margin-bottom: 20px;
    }

    .assigned-assets h4 {
      margin: 15px 0 10px 0;
      color: #333;
    }

    .asset-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .asset-item:last-child {
      border-bottom: none;
    }

    .asset-name {
      font-weight: 500;
    }

    .asset-tag {
      color: #666;
      font-size: 0.9rem;
    }

    .asset-category {
      color: #1976d2;
      font-size: 0.8rem;
    }

    .asset-value {
      font-weight: 500;
      color: #2e7d32;
    }

    .activity-controls {
      margin-bottom: 20px;
    }

    .activity-controls mat-form-field {
      width: 200px;
    }

    .activity-table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .activity-table {
      width: 100%;
    }

    .active {
      background-color: rgba(25, 118, 210, 0.1);
    }

    mat-nav-list a {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    @media (max-width: 768px) {
      .maintenance-grid {
        grid-template-columns: 1fr;
      }

      .analytics-grid {
        grid-template-columns: 1fr;
      }

      .header {
        flex-direction: column;
        gap: 20px;
        align-items: flex-start;
      }
    }
  `]
})
export class ReportsComponent implements OnInit {
  currentUser: User | null = null;
  loading = false;
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Reports', icon: 'analytics' }
  ];
  
  // Dashboard data
  dashboardStats: any = null;
  assetsByCategory: any[] = [];
  assetsByLocation: any[] = [];
  maintenanceSummary: any = null;
  userAssignments: any[] = [];
  activityLog: any[] = [];
  
  // Activity log filter
  selectedAction = '';
  activityColumns: string[] = ['timestamp', 'action', 'asset', 'user', 'description'];

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Use setTimeout to ensure this runs after initial change detection
    setTimeout(() => {
      this.loadAllReports();
    });
  }

  loadAllReports(): void {
    this.loading = true;
    this.cdr.detectChanges(); // Trigger change detection for loading state
    
    // Load dashboard stats
    this.reportsService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.loading = false;
        this.cdr.detectChanges(); // Trigger change detection after data update
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.snackBar.open('Error loading dashboard stats', 'Close', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges(); // Trigger change detection after error
      }
    });

    // Load other reports
    this.loadAssetsByCategory();
    this.loadAssetsByLocation();
    this.loadMaintenanceSummary();
    this.loadUserAssignments();
    this.loadActivityLog();
  }

  loadAssetsByCategory(): void {
    this.reportsService.getAssetsByCategory().subscribe({
      next: (data) => {
        this.assetsByCategory = data;
        this.cdr.detectChanges(); // Trigger change detection after data update
      },
      error: (error) => {
        console.error('Error loading assets by category:', error);
      }
    });
  }

  loadAssetsByLocation(): void {
    this.reportsService.getAssetsByLocation().subscribe({
      next: (data) => {
        this.assetsByLocation = data;
        this.cdr.detectChanges(); // Trigger change detection after data update
      },
      error: (error) => {
        console.error('Error loading assets by location:', error);
      }
    });
  }

  loadMaintenanceSummary(): void {
    this.reportsService.getMaintenanceSummary(30).subscribe({
      next: (data) => {
        this.maintenanceSummary = data;
        this.cdr.detectChanges(); // Trigger change detection after data update
      },
      error: (error) => {
        console.error('Error loading maintenance summary:', error);
      }
    });
  }

  loadUserAssignments(): void {
    this.reportsService.getUserAssignments().subscribe({
      next: (data) => {
        this.userAssignments = data;
        this.cdr.detectChanges(); // Trigger change detection after data update
      },
      error: (error) => {
        console.error('Error loading user assignments:', error);
      }
    });
  }

  loadActivityLog(): void {
    this.reportsService.getActivityLog(30, this.selectedAction || undefined).subscribe({
      next: (data) => {
        this.activityLog = data;
        this.cdr.detectChanges(); // Trigger change detection after data update
      },
      error: (error) => {
        console.error('Error loading activity log:', error);
      }
    });
  }

  refreshAllReports(): void {
    this.loadAllReports();
    this.snackBar.open('Reports refreshed successfully', 'Close', { duration: 2000 });
  }

  getPercentage(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  getMaxCount(data: any[]): number {
    return Math.max(...data.map(item => item.Count));
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  logout(): void {
    this.authService.logout();
  }
}