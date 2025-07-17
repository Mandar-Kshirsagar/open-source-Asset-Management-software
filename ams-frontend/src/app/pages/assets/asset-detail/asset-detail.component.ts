import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AssetService } from '../../../services/asset.service';
import { AuthService } from '../../../services/auth.service';
import { Asset } from '../../../models/asset.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="asset-detail-container">
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading asset details...</p>
      </div>

      <div *ngIf="!loading && asset" class="asset-detail-content">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-info">
            <h1>{{ asset.name }}</h1>
            <p class="asset-tag">{{ asset.assetTag }}</p>
            <div class="status-chip">
              <mat-chip [class]="'status-' + asset.status.toLowerCase()">
                {{ asset.status }}
              </mat-chip>
            </div>
          </div>
          <div class="header-actions">
            <button mat-button routerLink="/assets" class="back-btn">
              <mat-icon>arrow_back</mat-icon>
              Back to Assets
            </button>
            <button mat-raised-button color="primary" [routerLink]="['/assets', asset.id, 'edit']" *ngIf="isAdmin">
              <mat-icon>edit</mat-icon>
              Edit Asset
            </button>
            <button mat-raised-button color="warn" (click)="deleteAsset()" *ngIf="isAdmin">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
          <!-- Basic Information -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>info</mat-icon>
                Basic Information
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <label>Category</label>
                  <span>{{ asset.category }}</span>
                </div>
                <div class="info-item">
                  <label>Brand</label>
                  <span>{{ asset.brand }}</span>
                </div>
                <div class="info-item">
                  <label>Model</label>
                  <span>{{ asset.model }}</span>
                </div>
                <div class="info-item">
                  <label>Serial Number</label>
                  <span>{{ asset.serialNumber }}</span>
                </div>
                <div class="info-item">
                  <label>Condition</label>
                  <span [class]="'condition-' + asset.condition.toLowerCase()">{{ asset.condition }}</span>
                </div>
                <div class="info-item">
                  <label>Location</label>
                  <span>{{ asset.location }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Financial Information -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>attach_money</mat-icon>
                Financial Information
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <label>Purchase Price</label>
                  <span>{{ asset.purchasePrice | number:'1.2-2' }}</span>
                </div>
                <div class="info-item">
                  <label>Purchase Date</label>
                  <span>{{ asset.purchaseDate | date:'mediumDate' }}</span>
                </div>
                <div class="info-item" *ngIf="asset.warrantyExpiryDate">
                  <label>Warranty Expiry</label>
                  <span [class]="getWarrantyClass()">{{ asset.warrantyExpiryDate | date:'mediumDate' }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Assignment Information -->
          <mat-card class="info-card" *ngIf="asset.assignedToUser">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person</mat-icon>
                Assigned To
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="assignment-info">
                <div class="user-avatar">
                  <mat-icon>account_circle</mat-icon>
                </div>
                <div class="user-details">
                  <h3>{{ asset.assignedToUser.firstName }} {{ asset.assignedToUser.lastName }}</h3>
                  <p>{{ asset.assignedToUser.email }}</p>
                  <p *ngIf="asset.assignedToUser.role">{{ asset.assignedToUser.role }}</p>
                </div>
                <div class="assignment-actions" *ngIf="isAdmin">
                  <button mat-button color="warn" (click)="unassignAsset()">
                    <mat-icon>person_remove</mat-icon>
                    Unassign
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Description -->
          <mat-card class="info-card full-width" *ngIf="asset.description">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>description</mat-icon>
                Description
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="description-text">{{ asset.description }}</p>
            </mat-card-content>
          </mat-card>

          <!-- System Information -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>settings</mat-icon>
                System Information
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <label>Created</label>
                  <span>{{ asset.createdAt | date:'medium' }}</span>
                </div>
                <div class="info-item" *ngIf="asset.lastUpdatedAt">
                  <label>Last Updated</label>
                  <span>{{ asset.lastUpdatedAt | date:'medium' }}</span>
                </div>
                <div class="info-item">
                  <label>Asset ID</label>
                  <span>{{ asset.id }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && !asset" class="error-container">
        <mat-icon>error_outline</mat-icon>
        <h3>Asset Not Found</h3>
        <p>The asset you're looking for doesn't exist or has been removed.</p>
        <button mat-raised-button color="primary" routerLink="/assets">
          <mat-icon>arrow_back</mat-icon>
          Back to Assets
        </button>
      </div>
    </div>
  `,
  styles: [`
    .asset-detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
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

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }

    .header-info h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 2.5rem;
    }

    .asset-tag {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 1.1rem;
      font-family: monospace;
    }

    .status-chip {
      margin-bottom: 20px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .back-btn {
      color: #666;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    .info-card {
      height: fit-content;
    }

    .info-card mat-card-header {
      margin-bottom: 20px;
    }

    .info-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.2rem;
    }

    .info-grid {
      display: grid;
      gap: 15px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item label {
      font-weight: 500;
      color: #666;
      min-width: 120px;
    }

    .info-item span {
      color: #333;
      text-align: right;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .description-text {
      line-height: 1.6;
      color: #555;
      margin: 0;
    }

    .assignment-info {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .user-avatar mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
    }

    .user-details h3 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .user-details p {
      margin: 0 0 3px 0;
      color: #666;
    }

    .assignment-actions {
      margin-left: auto;
    }

    .error-container {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .error-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 20px;
      color: #ccc;
    }

    .error-container h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .error-container p {
      margin: 0 0 20px 0;
    }

    /* Status Colors */
    .status-available {
      background-color: #e8f5e8 !important;
      color: #2e7d32 !important;
    }

    .status-assigned {
      background-color: #e3f2fd !important;
      color: #1976d2 !important;
    }

    .status-maintenance {
      background-color: #fff3e0 !important;
      color: #f57c00 !important;
    }

    .status-retired {
      background-color: #ffebee !important;
      color: #d32f2f !important;
    }

    /* Condition Colors */
    .condition-excellent {
      color: #2e7d32;
      font-weight: 500;
    }

    .condition-good {
      color: #1976d2;
      font-weight: 500;
    }

    .condition-fair {
      color: #f57c00;
      font-weight: 500;
    }

    .condition-poor {
      color: #d32f2f;
      font-weight: 500;
    }

    .condition-damaged {
      color: #c62828;
      font-weight: 500;
    }

    /* Warranty Colors */
    .warranty-expired {
      color: #d32f2f;
      font-weight: 500;
    }

    .warranty-expiring {
      color: #f57c00;
      font-weight: 500;
    }

    .warranty-valid {
      color: #2e7d32;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        gap: 20px;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .content-grid {
        grid-template-columns: 1fr;
      }

      .assignment-info {
        flex-direction: column;
        text-align: center;
      }

      .assignment-actions {
        margin-left: 0;
        margin-top: 15px;
      }
    }
  `]
})
export class AssetDetailComponent implements OnInit {
  asset: Asset | null = null;
  loading = true;
  currentUser: User | null = null;
  isAdmin = false;

  constructor(
    private assetService: AssetService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.hasRole('Admin');
    this.loadAsset();
  }

  loadAsset(): void {
    this.route.params.subscribe(params => {
      const assetId = +params['id'];
      if (assetId) {
        this.assetService.getAssetById(assetId).subscribe({
          next: (asset: Asset) => {
            this.asset = asset;
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            console.error('Error loading asset:', error);
            this.snackBar.open('Error loading asset', 'Close', { duration: 3000 });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      } else {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteAsset(): void {
    if (this.asset) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Delete Asset',
          message: `Are you sure you want to delete "${this.asset.name}"? This action cannot be undone.`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.assetService.deleteAsset(this.asset!.id).subscribe({
            next: () => {
              this.snackBar.open('Asset deleted successfully', 'Close', { duration: 3000 });
              this.router.navigate(['/assets']);
            },
            error: (error: any) => {
              console.error('Error deleting asset:', error);
              this.snackBar.open('Error deleting asset', 'Close', { duration: 3000 });
            }
          });
        }
      });
    }
  }

  unassignAsset(): void {
    if (this.asset) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Unassign Asset',
          message: `Are you sure you want to unassign "${this.asset.name}" from ${this.asset.assignedToUser?.firstName} ${this.asset.assignedToUser?.lastName}?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.assetService.unassignAsset(this.asset!.id).subscribe({
            next: () => {
              this.snackBar.open('Asset unassigned successfully', 'Close', { duration: 3000 });
              this.loadAsset(); // Reload to update the UI
            },
            error: (error: any) => {
              console.error('Error unassigning asset:', error);
              this.snackBar.open('Error unassigning asset', 'Close', { duration: 3000 });
            }
          });
        }
      });
    }
  }

  getWarrantyClass(): string {
    if (!this.asset?.warrantyExpiryDate) return '';
    
    const warrantyDate = new Date(this.asset.warrantyExpiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((warrantyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return 'warranty-expired';
    } else if (daysUntilExpiry <= 30) {
      return 'warranty-expiring';
    } else {
      return 'warranty-valid';
    }
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }
}

// Simple confirmation dialog component
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Confirm</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule]
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }) {}
} 