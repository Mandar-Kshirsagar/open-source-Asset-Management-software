import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, startWith, switchMap, catchError, of } from 'rxjs';

// Import shared Material module and required Material types
import { SharedMaterialModule } from '../../shared/material.module';
import { HeaderComponent } from '../../shared/header/header.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';

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
    SharedMaterialModule
  ],
  template: `
    <div class="assets-container">
      <div class="assets-content">
        <h1 class="page-title">Assets</h1>
        
        <!-- View Toggle and Search -->
        <div class="assets-actions">
          <div class="view-toggle">
            <button mat-button [class.active]="viewMode === 'list'" (click)="viewMode = 'list'">
              <mat-icon>view_list</mat-icon> List
            </button>
            <button mat-button [class.active]="viewMode === 'grid'" (click)="viewMode = 'grid'">
              <mat-icon>view_module</mat-icon> Grid
            </button>
          </div>
          
          <mat-form-field class="search-field" appearance="outline">
            <mat-label>Search Assets</mat-label>
            <input matInput [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Search...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
        <mat-icon>home</mat-icon>
        <span class="breadcrumb-separator">></span>
              <span>Assets</span>
      </div>

      <!-- Filters and Actions -->
      <div class="filters-container">
        <div class="filter-left">
          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Edit</mat-label>
            <mat-select [(value)]="selectedAction">
              <mat-option value="">Select Action</mat-option>
              <mat-option value="edit">Edit</mat-option>
              <mat-option value="delete">Delete</mat-option>
              <mat-option value="assign">Assign</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" class="go-button" (click)="executeAction()">Go</button>
            </div>

        <div class="filter-right">
          <mat-form-field appearance="outline" class="search-input">
            <mat-label>Search</mat-label>
            <input matInput [(ngModel)]="searchTerm" (input)="onSearch()">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
          <button mat-icon-button matTooltip="Clear Search" (click)="clearSearch()">
            <mat-icon>clear</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Refresh" (click)="loadAssets()">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Export" [matMenuTriggerFor]="exportMenu">
            <mat-icon>download</mat-icon>
          </button>
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportToCSV()">
              <mat-icon>file_download</mat-icon>
              Export to CSV
            </button>
            <button mat-menu-item (click)="exportToPDF()">
              <mat-icon>picture_as_pdf</mat-icon>
              Export to PDF
            </button>
          </mat-menu>
          <button mat-icon-button matTooltip="Column Settings">
            <mat-icon>view_column</mat-icon>
          </button>
        </div>
      </div>

      <!-- Results Info -->
      <div class="results-info" *ngIf="!loading">
        Showing {{ getDisplayRange() }} of {{ totalAssets }} rows
        <span class="pagination-controls">
          <mat-form-field appearance="outline" class="page-size-select">
            <mat-select [(value)]="pageSize" (selectionChange)="onPageSizeChange()">
              <mat-option value="20">20</mat-option>
              <mat-option value="50">50</mat-option>
              <mat-option value="100">100</mat-option>
            </mat-select>
          </mat-form-field>
          rows per page
        </span>
            </div>

      <!-- Assets Table -->
      <div class="table-container" *ngIf="!loading; else loadingTemplate">
        <table mat-table [dataSource]="dataSource" matSort class="assets-table">
          
          <!-- Checkbox Column -->
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox (change)="$event ? masterToggle() : null"
                          [checked]="selection.hasValue() && isAllSelected()"
                          [indeterminate]="selection.hasValue() && !isAllSelected()">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let asset">
              <mat-checkbox (click)="$event.stopPropagation()"
                          (change)="$event ? selection.toggle(asset) : null"
                          [checked]="selection.isSelected(asset)">
              </mat-checkbox>
            </td>
          </ng-container>

          <!-- Asset Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Asset Name</th>
            <td mat-cell *matCellDef="let asset">
              <a [routerLink]="['/assets', asset.id]" class="asset-link">{{ asset.name }}</a>
            </td>
          </ng-container>

          <!-- Device Image Column -->
          <ng-container matColumnDef="image">
            <th mat-header-cell *matHeaderCellDef>Device Image</th>
            <td mat-cell *matCellDef="let asset">
              <div class="device-image">
                <mat-icon class="device-icon">laptop</mat-icon>
              </div>
            </td>
          </ng-container>

          <!-- Asset Tag Column -->
          <ng-container matColumnDef="assetTag">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Asset Tag</th>
            <td mat-cell *matCellDef="let asset">{{ asset.assetTag }}</td>
          </ng-container>

          <!-- Serial Column -->
          <ng-container matColumnDef="serialNumber">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Serial</th>
            <td mat-cell *matCellDef="let asset">{{ asset.serialNumber }}</td>
          </ng-container>

          <!-- Model Column -->
          <ng-container matColumnDef="model">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Model</th>
            <td mat-cell *matCellDef="let asset">{{ asset.model }}</td>
          </ng-container>

          <!-- Category Column -->
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
            <td mat-cell *matCellDef="let asset">{{ asset.category }}</td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let asset">
              <mat-chip [ngClass]="getStatusClass(asset.status)" class="status-chip">
                <mat-icon class="status-icon">{{ getStatusIcon(asset.status) }}</mat-icon>
                {{ asset.status }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Checked Out To Column -->
          <ng-container matColumnDef="assignedTo">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Checked Out To</th>
            <td mat-cell *matCellDef="let asset">
              <div *ngIf="asset.assignedToUser" class="assigned-user">
                <mat-icon class="user-icon">person</mat-icon>
                {{ asset.assignedToUser.firstName }} {{ asset.assignedToUser.lastName }}
              </div>
              <span *ngIf="!asset.assignedToUser" class="no-assignment">-</span>
            </td>
          </ng-container>

          <!-- Location Column -->
          <ng-container matColumnDef="location">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Location</th>
            <td mat-cell *matCellDef="let asset">{{ asset.location }}</td>
          </ng-container>

          <!-- Purchase Cost Column -->
          <ng-container matColumnDef="purchasePrice">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Purchase Cost</th>
            <td mat-cell *matCellDef="let asset">{{ asset.purchasePrice | currency }}</td>
          </ng-container>

          <!-- Current Value Column -->
          <ng-container matColumnDef="currentValue">
            <th mat-header-cell *matHeaderCellDef>Current Value</th>
            <td mat-cell *matCellDef="let asset">{{ asset.purchasePrice | currency }}</td>
          </ng-container>

          <!-- Change Column -->
          <ng-container matColumnDef="change">
            <th mat-header-cell *matHeaderCellDef>Change</th>
            <td mat-cell *matCellDef="let asset">
              <span class="change-indicator">-</span>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let asset">
              <button mat-icon-button [matMenuTriggerFor]="actionMenu" class="action-button">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #actionMenu="matMenu">
                <button mat-menu-item [routerLink]="['/assets', asset.id]">
                  <mat-icon>visibility</mat-icon>
                  View
                </button>
                <button mat-menu-item [routerLink]="['/assets', asset.id, 'edit']">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-menu-item (click)="deleteAsset(asset)">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="assignAsset(asset)">
                  <mat-icon>person_add</mat-icon>
                  Assign
                </button>
                <button mat-menu-item (click)="checkOut(asset)">
                  <mat-icon>output</mat-icon>
                  Check Out
                      </button>
              </mat-menu>
            </td>
              </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let asset; columns: displayedColumns;" 
              [class.selected-row]="selection.isSelected(asset)"
              (click)="rowClicked(asset)"></tr>
        </table>

        <!-- No Data Template -->
        <div *ngIf="dataSource.data.length === 0" class="no-data">
          <mat-icon class="no-data-icon">inventory_2</mat-icon>
          <h3>No assets found</h3>
          <p>{{ searchTerm ? 'No assets match your search criteria.' : 'No assets have been added yet.' }}</p>
          <button mat-raised-button color="primary" routerLink="/assets/new" *ngIf="!searchTerm">
            <mat-icon>add</mat-icon>
            Add First Asset
          </button>
        </div>
            </div>

      <!-- Pagination -->
      <mat-paginator #paginator
                     [length]="totalAssets"
                     [pageSize]="pageSize"
                     [pageSizeOptions]="[20, 50, 100]"
                     [showFirstLastButtons]="true"
                     (page)="onPageChange($event)"
                     class="assets-paginator">
      </mat-paginator>

      <!-- Loading Template -->
      <ng-template #loadingTemplate>
        <div class="loading-container">
          <mat-progress-spinner mode="indeterminate" diameter="60"></mat-progress-spinner>
          <p>Loading assets...</p>
            </div>
      </ng-template>

      <!-- Error Message -->
      <div class="error-message" *ngIf="error">
        <mat-icon color="warn">error</mat-icon>
        <span>{{ error }}</span>
          </div>
    </div>
  `,
  styles: [`
    .assets-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f5f5f5;
    }

    /* Header Toolbar */
    .assets-toolbar {
      background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
      padding: 0 16px;
      min-height: 64px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .app-logo {
      font-size: 28px;
      margin-right: 8px;
      color: #ff6b35;
    }

    .app-title {
      font-size: 20px;
      font-weight: bold;
      margin-right: 8px;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .header-search {
      margin: 0 16px;
      width: 200px;
    }

    .header-search ::ng-deep .mat-mdc-form-field-bottom-align::before {
      display: none;
    }

    .header-search ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: rgba(255,255,255,0.1);
    }

    .create-button {
      margin-left: 16px;
      background-color: #4caf50 !important;
      color: white !important;
    }

    .user-avatar {
      margin-left: 16px;
    }

    /* Demo Banner */
    .demo-banner {
      background: linear-gradient(135deg, #00bcd4 0%, #26c6da 100%);
      color: white;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      font-weight: 500;
    }

    .demo-banner mat-icon {
      margin-right: 8px;
    }

    /* Breadcrumb */
    .breadcrumb {
      padding: 16px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #666;
    }

    .breadcrumb mat-icon {
      margin-right: 8px;
      font-size: 18px;
    }

    .breadcrumb-separator {
      margin: 0 8px;
    }

    /* Filters */
    .filters-container {
      background: white;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .filter-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .filter-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-select {
      width: 120px;
    }

    .go-button {
      height: 40px;
      background-color: #6c9bd2;
      color: white;
    }

    .search-input {
      width: 200px;
    }

    /* Results Info */
    .results-info {
      background: white;
      padding: 8px 16px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: #666;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .page-size-select {
      width: 60px;
    }

    /* Table */
    .table-container {
      flex: 1;
      overflow: auto;
      background: white;
    }

    .assets-table {
      width: 100%;
      background: white;
    }

    .assets-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #dee2e6;
    }

    .assets-table tr:hover {
      background-color: #f8f9fa;
    }

    .selected-row {
      background-color: #e3f2fd !important;
    }

    .asset-link {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
    }

    .asset-link:hover {
      text-decoration: underline;
    }

    .device-image {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .device-icon {
      color: #666;
      font-size: 24px;
    }

    .status-chip {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-chip.ready {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-chip.deployed {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .status-chip.maintenance {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .status-chip.retired {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .status-icon {
      font-size: 14px;
      margin-right: 4px;
    }

    .assigned-user {
      display: flex;
      align-items: center;
    }

    .user-icon {
      margin-right: 4px;
      font-size: 16px;
      color: #666;
    }

    .no-assignment {
      color: #999;
    }

    .change-indicator {
      color: #999;
    }

    .action-button {
      opacity: 0.7;
    }

    .action-button:hover {
      opacity: 1;
    }

    /* No Data */
    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      text-align: center;
      color: #666;
    }

    .no-data-icon {
      font-size: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: #666;
    }

    /* Error */
    .error-message {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      color: #f44336;
      background: #ffebee;
      border: 1px solid #ffcdd2;
      margin: 16px;
      border-radius: 4px;
    }

    .error-message mat-icon {
      margin-right: 8px;
    }

    /* Paginator */
    .assets-paginator {
      background: white;
      border-top: 1px solid #e0e0e0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-search {
        display: none;
      }
      
      .filter-right {
        flex-wrap: wrap;
      }
      
      .results-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class AssetsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data and state
  dataSource = new MatTableDataSource<Asset>([]);
  assets: Asset[] = [];
  totalAssets = 0;
  loading = false;
  error = '';
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Assets', icon: 'inventory' }
  ];
  
  // Search and filters
  searchTerm = '';
  selectedAction = '';
  pageSize = 20;
  viewMode = 'list'; // Default view mode
  currentPage = 0;
  
  // Selection
  selection = new SelectionModel<Asset>(true, []);
  
  // Table configuration
  displayedColumns: string[] = [
    'select', 'name', 'image', 'assetTag', 'serialNumber', 'model', 
    'category', 'status', 'assignedTo', 'location', 'purchasePrice', 
    'currentValue', 'change', 'actions'
  ];
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private assetService: AssetService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadAssets();
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
    this.error = '';
    this.cdr.markForCheck();
    
    const filter = {
      searchTerm: this.searchTerm || undefined,
      page: this.currentPage + 1,
      pageSize: this.pageSize
    };
    
    this.assetService.getAllAssets(filter).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.error = 'Failed to load assets';
        this.snackBar.open('Failed to load assets', 'Close', { duration: 3000 });
        return of([]);
      })
    ).subscribe((assets: Asset[]) => {
      this.assets = assets;
      this.dataSource.data = assets;
      this.totalAssets = assets.length; // In real app, this should come from API
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAssets();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadAssets();
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() 
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row));
  }

  rowClicked(asset: Asset): void {
    this.selection.toggle(asset);
  }

  // Action methods
  executeAction(): void {
    if (!this.selectedAction || this.selection.selected.length === 0) {
      this.snackBar.open('Please select an action and assets', 'Close', { duration: 3000 });
      return;
    }

    const selectedAssets = this.selection.selected;
    
    switch (this.selectedAction) {
      case 'edit':
        if (selectedAssets.length > 0) {
          this.router.navigate(['/assets', selectedAssets[0].id, 'edit']);
        } else {
          this.snackBar.open('Please select at least one asset to edit', 'Close', { duration: 3000 });
        }
        break;
      case 'delete':
        this.bulkDelete(selectedAssets);
        break;
      case 'assign':
        this.bulkAssign(selectedAssets);
        break;
    }
  }

  deleteAsset(asset: Asset): void {
    if (confirm(`Are you sure you want to delete ${asset.name}?`)) {
      this.assetService.deleteAsset(asset.id).pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.snackBar.open('Failed to delete asset', 'Close', { duration: 3000 });
          return of(null);
        })
      ).subscribe(() => {
        this.snackBar.open('Asset deleted successfully', 'Close', { duration: 3000 });
        this.loadAssets();
      });
    }
  }

  bulkDelete(assets: Asset[]): void {
    if (confirm(`Are you sure you want to delete ${assets.length} selected assets?`)) {
      this.loading = true;
      const deletePromises = assets.map(asset => 
        this.assetService.deleteAsset(asset.id).pipe(
          catchError(err => {
            this.snackBar.open(`Failed to delete asset ${asset.name}`, 'Close', { duration: 3000 });
            return of(null);
          })
        ).toPromise()
      );

      Promise.all(deletePromises).then(() => {
        this.snackBar.open(`${assets.length} assets deleted successfully`, 'Close', { duration: 3000 });
        this.selection.clear();
        this.loadAssets();
      }).finally(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
    }
  }

  assignAsset(asset: Asset): void {
    const userId = prompt(`Enter User ID to assign ${asset.name} to:`);
    if (userId) {
      this.assetService.assignAsset(asset.id, +userId).pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.snackBar.open(`Failed to assign asset ${asset.name}`, 'Close', { duration: 3000 });
          return of(null);
        })
      ).subscribe(() => {
        this.snackBar.open(`${asset.name} assigned successfully`, 'Close', { duration: 3000 });
        this.loadAssets();
      });
    }
  }

  bulkAssign(assets: Asset[]): void {
    const userId = prompt(`Enter User ID to assign ${assets.length} selected assets to:`);
    if (userId) {
      this.loading = true;
      const assignPromises = assets.map(asset => 
        this.assetService.assignAsset(asset.id, +userId).pipe(
          catchError(err => {
            this.snackBar.open(`Failed to assign asset ${asset.name}`, 'Close', { duration: 3000 });
            return of(null);
          })
        ).toPromise()
      );

      Promise.all(assignPromises).then(() => {
        this.snackBar.open(`${assets.length} assets assigned successfully`, 'Close', { duration: 3000 });
        this.selection.clear();
        this.loadAssets();
      }).finally(() => {
        this.loading = false;
        this.cdr.markForCheck();
      });
    }
  }

  checkOut(asset: Asset): void {
    if (confirm(`Are you sure you want to unassign ${asset.name}?`)) {
      this.assetService.unassignAsset(asset.id).pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          this.snackBar.open(`Failed to unassign asset ${asset.name}`, 'Close', { duration: 3000 });
          return of(null);
        })
      ).subscribe(() => {
        this.snackBar.open(`${asset.name} unassigned successfully`, 'Close', { duration: 3000 });
        this.loadAssets();
      });
    }
  }

  // Export methods
  exportToCSV(): void {
    this.snackBar.open('Exporting to CSV...', 'Close', { duration: 2000 });
  }

  exportToPDF(): void {
    this.snackBar.open('Exporting to PDF...', 'Close', { duration: 2000 });
  }

  // Helper methods
  getStatusClass(status: string | undefined | null): string {
    if (typeof status !== 'string') {
      return 'unknown'; // Or a default class for unknown status
    }
    switch (status.toLowerCase()) {
      case 'ready to deploy':
      case 'active':
        return 'ready';
      case 'deployed':
        return 'deployed';
      case 'maintenance':
        return 'maintenance';
      case 'retired':
        return 'retired';
      default:
        return 'unknown';
    }
  }

  getStatusIcon(status: string | undefined | null): string {
    if (typeof status !== 'string') {
      return 'help'; // Or a default icon for unknown status
    }
    switch (status.toLowerCase()) {
      case 'ready to deploy':
      case 'active':
        return 'check_circle';
      case 'deployed':
        return 'person';
      case 'maintenance':
        return 'build';
      case 'retired':
        return 'archive';
      default:
        return 'help';
    }
  }

  getDisplayRange(): string {
    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalAssets);
    return `${start} to ${end}`;
  }

  logout(): void {
    this.authService.logout();
  }
}