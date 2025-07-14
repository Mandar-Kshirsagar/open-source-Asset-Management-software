import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, startWith, switchMap, catchError, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

// Import shared Material module instead of individual modules
import { SharedMaterialModule } from '../../shared/material.module';

import { AssetService } from '../../services/asset.service';
import { AuthService } from '../../services/auth.service';
import { Asset } from '../../models/asset.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-assets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedMaterialModule,
    ScrollingModule
  ],
  template: `
    <div class="assets-container">
      <mat-toolbar color="primary" class="assets-toolbar">
        <span>Assets Management</span>
        <span class="toolbar-spacer"></span>
        <button mat-raised-button color="accent" routerLink="/assets/new" *ngIf="hasRole('Admin')">
          <mat-icon>add</mat-icon>
          Add Asset
        </button>
        <button mat-icon-button [matMenuTriggerFor]="menu">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </mat-menu>
      </mat-toolbar>

      <div class="search-container">
        <mat-form-field class="search-field" appearance="outline">
          <mat-label>Search assets...</mat-label>
          <input matInput 
                 [(ngModel)]="searchTerm" 
                 (input)="onSearch()"
                 placeholder="Search by name, category, or ID">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="assets-content" *ngIf="!loading; else loadingTemplate">
        <div class="assets-grid" *ngIf="assets.length > 0; else noAssetsTemplate">
          <cdk-virtual-scroll-viewport itemSize="220" class="assets-viewport">
            <mat-card *cdkVirtualFor="let asset of assets; trackBy: trackByAssetId" 
                      class="asset-card performance-optimized">
              <mat-card-header>
                <mat-card-title>{{ asset.name }}</mat-card-title>
                <mat-card-subtitle>ID: {{ asset.id }}</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <div class="asset-info">
                  <p><strong>Category:</strong> {{ asset.category }}</p>
                  <p><strong>Status:</strong> 
                    <mat-chip [color]="getStatusColor(asset.status)" selected>
                      {{ asset.status }}
                    </mat-chip>
                  </p>
                  <p><strong>Location:</strong> {{ asset.location }}</p>
                  <p><strong>Purchase Date:</strong> {{ asset.purchaseDate | date }}</p>
                  <p><strong>Purchase Price:</strong> {{ asset.purchasePrice | currency }}</p>
                </div>
              </mat-card-content>
              
              <mat-card-actions align="end">
                <button mat-button color="primary" [routerLink]="['/assets', asset.id]">
                  <mat-icon>visibility</mat-icon>
                  View
                </button>
                <button mat-button color="accent" [routerLink]="['/assets', asset.id, 'edit']" *ngIf="hasRole('Admin')">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-button color="warn" 
                        (click)="deleteAsset(asset)" 
                        [disabled]="deletingAssetId === asset.id"
                        *ngIf="hasRole('Admin')">
                  <mat-progress-spinner *ngIf="deletingAssetId === asset.id" 
                                      diameter="20" 
                                      mode="indeterminate">
                  </mat-progress-spinner>
                  <mat-icon *ngIf="deletingAssetId !== asset.id">delete</mat-icon>
                  Delete
                </button>
              </mat-card-actions>
            </mat-card>
          </cdk-virtual-scroll-viewport>
        </div>

        <ng-template #noAssetsTemplate>
          <div class="no-assets">
            <mat-icon class="no-assets-icon">inventory_2</mat-icon>
            <h2>No assets found</h2>
            <p>{{ searchTerm ? 'No assets match your search criteria.' : 'No assets have been added yet.' }}</p>
            <button mat-raised-button color="primary" routerLink="/assets/new" *ngIf="hasRole('Admin') && !searchTerm">
              <mat-icon>add</mat-icon>
              Add First Asset
            </button>
          </div>
        </ng-template>
      </div>

      <ng-template #loadingTemplate>
        <div class="loading-container">
          <mat-progress-spinner mode="indeterminate" diameter="60"></mat-progress-spinner>
          <p>Loading assets...</p>
        </div>
      </ng-template>

      <div class="error-message" *ngIf="error">
        <mat-icon color="warn">error</mat-icon>
        <span>{{ error }}</span>
      </div>
    </div>
  `,
  styles: [`
    .assets-container {
      contain: layout style paint;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .assets-toolbar {
      flex-shrink: 0;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .search-container {
      padding: 1rem;
      flex-shrink: 0;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .assets-content {
      flex: 1;
      overflow: hidden;
    }

    .assets-viewport {
      height: 100%;
      will-change: scroll-position;
    }

    .assets-grid {
      height: 100%;
      padding: 0 1rem;
    }

    .asset-card {
      margin-bottom: 1rem;
      transition: transform 0.2s ease-in-out;
      contain: layout style paint;
    }

    .asset-card:hover {
      transform: translateY(-2px);
    }

    .asset-info p {
      margin: 0.5rem 0;
    }

    .no-assets, .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
    }

    .no-assets-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #ccc;
      margin-bottom: 1rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      color: #f44336;
    }

    .error-message mat-icon {
      margin-right: 0.5rem;
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
    // Initialize search with debouncing for better performance
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.loading = true;
        this.cdr.markForCheck();
        return this.assetService.getAllAssets({ 
          searchTerm: term.trim() || undefined,
          page: 1,
          pageSize: 50
        }).pipe(
          catchError(err => {
            this.error = 'Failed to search assets';
            this.snackBar.open('Failed to search assets', 'Close', { duration: 3000 });
            return of([]);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((assets: Asset[]) => {
      this.assets = assets;
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.loadAssets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAssets(): void {
    this.loading = true;
    this.cdr.markForCheck();
    
    this.assetService.getAllAssets().pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.error = 'Failed to load assets';
        this.snackBar.open('Failed to load assets', 'Close', { duration: 3000 });
        return of([]);
      })
    ).subscribe((assets: Asset[]) => {
      this.assets = assets;
      this.loading = false;
      this.cdr.markForCheck();
    });
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
    if (confirm(`Are you sure you want to delete ${asset.name}?`)) {
      this.deletingAssetId = asset.id;
      this.cdr.markForCheck();
      
      this.assetService.deleteAsset(asset.id).pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.snackBar.open('Failed to delete asset', 'Close', { duration: 3000 });
          return of(null);
        })
      ).subscribe(() => {
        this.deletingAssetId = null;
        this.loadAssets();
        this.snackBar.open('Asset deleted successfully', 'Close', { duration: 3000 });
      });
    }
  }

  trackByAssetId(index: number, asset: Asset): number {
    return asset.id;
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return 'primary';
      case 'maintenance': return 'accent';
      case 'retired': return 'warn';
      default: return '';
    }
  }
} 