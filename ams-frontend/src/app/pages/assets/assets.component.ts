import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, startWith, switchMap, catchError, of } from 'rxjs';
import { AssetService } from '../../services/asset.service';
import { AuthService } from '../../services/auth.service';
import { Asset } from '../../models/asset.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    ScrollingModule
  ],
  template: `
    <mat-toolbar color="primary">
      <span>Asset Management System</span>
      <span class="spacer"></span>
      <button mat-button [matMenuTriggerFor]="userMenu">
        {{ currentUser?.firstName }} {{ currentUser?.lastName }}
        <mat-icon>arrow_drop_down</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </mat-toolbar>

    <div class="assets-container">
      <mat-sidenav-container>
        <mat-sidenav mode="side" opened class="sidenav">
          <mat-nav-list>
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
              <mat-icon>dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            <a mat-list-item routerLink="/assets" routerLinkActive="active">
              <mat-icon>inventory</mat-icon>
              <span>Assets</span>
            </a>
            <a mat-list-item routerLink="/users" routerLinkActive="active" *ngIf="isAdmin">
              <mat-icon>people</mat-icon>
              <span>Users</span>
            </a>
            <a mat-list-item routerLink="/reports" routerLinkActive="active">
              <mat-icon>analytics</mat-icon>
              <span>Reports</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content class="content">
          <div class="assets-content">
            <div class="header">
              <h1>Assets</h1>
              <button mat-raised-button color="primary" routerLink="/assets/new" *ngIf="isAdmin">
                <mat-icon>add</mat-icon>
                Add Asset
              </button>
            </div>

            <div class="filters">
              <mat-form-field appearance="outline">
                <mat-label for="asset-search">Search</mat-label>
                <input matInput id="asset-search" [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Search assets..." aria-label="Search assets">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </div>

            <div class="assets-grid">
              <div *ngIf="loading && assets.length === 0" class="loading-container">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Loading assets...</p>
              </div>

              <div *ngIf="error" class="error-container">
                <mat-icon>error</mat-icon>
                <h3>Error Loading Assets</h3>
                <p>{{ error }}</p>
                <button mat-raised-button color="primary" (click)="loadAssets()">Retry</button>
              </div>

              <ng-container *ngIf="!loading || assets.length > 0">
                <cdk-virtual-scroll-viewport itemSize="400" class="virtual-scroll-viewport">
                  <mat-card *cdkVirtualFor="let asset of assets" class="asset-card">
                    <mat-card-header>
                      <mat-card-title>{{ asset.name }}</mat-card-title>
                      <mat-card-subtitle>{{ asset.assetTag }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <p><strong>Category:</strong> {{ asset.category }}</p>
                      <p><strong>Brand:</strong> {{ asset.brand }}</p>
                      <p><strong>Model:</strong> {{ asset.model }}</p>
                      <p><strong>Status:</strong> 
                        <span [class]="'status-' + asset.status.toLowerCase()">{{ asset.status }}</span>
                      </p>
                      <p><strong>Location:</strong> {{ asset.location }}</p>
                      <p><strong>Condition:</strong> {{ asset.condition }}</p>
                      <p *ngIf="asset.assignedToUser">
                        <strong>Assigned to:</strong> {{ asset.assignedToUser.firstName }} {{ asset.assignedToUser.lastName }}
                      </p>
                    </mat-card-content>
                    <mat-card-actions>
                      <button mat-button [routerLink]="['/assets', asset.id]">View Details</button>
                      <button mat-button [routerLink]="['/assets', asset.id, 'edit']" *ngIf="isAdmin">Edit</button>
                      <button mat-button color="warn" (click)="deleteAsset(asset)" *ngIf="isAdmin" [disabled]="deletingAssetId === asset.id">
                        <mat-spinner diameter="16" *ngIf="deletingAssetId === asset.id"></mat-spinner>
                        <mat-icon *ngIf="deletingAssetId !== asset.id">delete</mat-icon>
                        {{ deletingAssetId === asset.id ? 'Deleting...' : 'Delete' }}
                      </button>
                    </mat-card-actions>
                  </mat-card>
                </cdk-virtual-scroll-viewport>
              </ng-container>
            </div>

            <div *ngIf="!loading && !error && assets.length === 0" class="no-assets">
              <mat-icon>inventory_2</mat-icon>
              <h3>No assets found</h3>
              <p>Try adjusting your search criteria or add a new asset.</p>
            </div>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }

    .assets-container {
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

    .filters {
      margin-bottom: 30px;
    }

    .filters mat-form-field {
      width: 300px;
    }

    .assets-grid {
      height: calc(100vh - 200px);
    }

    .virtual-scroll-viewport {
      height: 100%;
      width: 100%;
    }

    .asset-card {
      height: fit-content;
      margin-bottom: 20px;
    }

    .status-available {
      color: #4caf50;
      font-weight: 500;
    }

    .status-assigned {
      color: #2196f3;
      font-weight: 500;
    }

    .status-maintenance {
      color: #ff9800;
      font-weight: 500;
    }

    .status-retired {
      color: #f44336;
      font-weight: 500;
    }

    .no-assets {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-assets mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 20px;
      color: #ccc;
    }

    .no-assets h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .no-assets p {
      margin: 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      grid-column: 1 / -1;
    }

    .loading-container p {
      margin-top: 20px;
      color: #666;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      grid-column: 1 / -1;
      color: #f44336;
    }

    .error-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 20px;
    }

    .error-container h3 {
      margin: 0 0 10px 0;
      color: #f44336;
    }

    .error-container p {
      margin: 0 0 20px 0;
      color: #666;
    }

    .active {
      background-color: rgba(25, 118, 210, 0.1);
    }

    mat-nav-list a {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    mat-icon {
      width: 24px;
      height: 24px;
      font-size: 24px;
      display: inline-block;
      vertical-align: middle;
    }

    mat-spinner {
      width: 50px !important;
      height: 50px !important;
      display: inline-block;
      vertical-align: middle;
    }
  `]
})
export class AssetsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  assets: Asset[] = [];
  searchTerm = '';
  loading = false;
  error = '';
  deletingAssetId: number | null = null;
  isAdmin = false; // Cache admin role check
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private assetService: AssetService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.hasRole('Admin');
    // Setup debounced search with better performance
    this.searchSubject.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        this.loading = true;
        
        if (!searchTerm.trim()) {
          return this.assetService.getAllAssets({ page: 1, pageSize: 20 });
        }
        
        return this.assetService.getAllAssets({ 
          searchTerm: searchTerm.trim(), 
          page: 1, 
          pageSize: 50 
        });
      }),                   
      catchError(error => {
        console.error('Error loading assets:', error);
        this.error = 'Failed to load assets';
        this.loading = false;
        this.snackBar.open('Error loading assets', 'Close', { duration: 3000 });
        return of([]);
      }),
      takeUntil(this.destroy$)
    ).subscribe(assets => {
      const assetsAny: any = assets;
      this.assets = Array.isArray(assetsAny) ? assetsAny : (assetsAny?.data || assetsAny?.Data || []);
      this.loading = false;
      this.error = '';
      this.deletingAssetId = null;
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    // Initial load is handled by the searchSubject with startWith('')
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAssets(): void {
    this.searchSubject.next('');
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  logout(): void {
    this.authService.logout();
  }

  deleteAsset(asset: Asset): void {
    const confirmed = confirm(`Are you sure you want to delete asset "${asset.name}"? This action cannot be undone.`);
    
    if (confirmed) {
      this.deletingAssetId = asset.id;
      this.assetService.deleteAsset(asset.id).subscribe({
        next: () => {
          this.snackBar.open('Asset deleted successfully', 'Close', { duration: 3000 });
          this.deletingAssetId = null;
          this.loadAssets(); // Reload assets after deletion
        },
        error: (error) => {
          console.error('Error deleting asset:', error);
          this.snackBar.open('Failed to delete asset', 'Close', { duration: 3000 });
          this.deletingAssetId = null;
        }
      });
    }
  }
} 