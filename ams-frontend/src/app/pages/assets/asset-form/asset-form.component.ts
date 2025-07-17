import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AssetService } from '../../../services/asset.service';
import { UserService } from '../../../services/user.service';
import { Asset, CreateAsset, UpdateAsset } from '../../../models/asset.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="asset-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Asset' : 'Create New Asset' }}</mat-card-title>
          <mat-card-subtitle>{{ isEditMode ? 'Update asset information' : 'Add a new asset to the system' }}</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="assetForm" (ngSubmit)="onSubmit()" class="asset-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label for="asset-name">Asset Name *</mat-label>
                <input matInput id="asset-name" formControlName="name" placeholder="Enter asset name" aria-label="Asset name">
                <mat-error *ngIf="assetForm.get('name')?.hasError('required')">
                  Asset name is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label for="asset-description">Description</mat-label>
                <textarea matInput id="asset-description" formControlName="description" rows="3" placeholder="Enter asset description" aria-label="Asset description"></textarea>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-tag">Asset Tag *</mat-label>
                <input matInput id="asset-tag" formControlName="assetTag" placeholder="Enter asset tag" aria-label="Asset tag">
                <mat-error *ngIf="assetForm.get('assetTag')?.hasError('required')">
                  Asset tag is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-category">Category *</mat-label>
                <mat-select id="asset-category" formControlName="category" aria-label="Asset category">
                  <mat-option *ngFor="let category of categories" [value]="category">
                    {{ category }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="assetForm.get('category')?.hasError('required')">
                  Category is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-brand">Brand *</mat-label>
                <input matInput id="asset-brand" formControlName="brand" placeholder="Enter brand" aria-label="Asset brand">
                <mat-error *ngIf="assetForm.get('brand')?.hasError('required')">
                  Brand is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-model">Model *</mat-label>
                <input matInput id="asset-model" formControlName="model" placeholder="Enter model" aria-label="Asset model">
                <mat-error *ngIf="assetForm.get('model')?.hasError('required')">
                  Model is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-serial">Serial Number *</mat-label>
                <input matInput id="asset-serial" formControlName="serialNumber" placeholder="Enter serial number" aria-label="Asset serial number">
                <mat-error *ngIf="assetForm.get('serialNumber')?.hasError('required')">
                  Serial number is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-price">Purchase Price *</mat-label>
                <input matInput id="asset-price" type="number" formControlName="purchasePrice" placeholder="Enter purchase price" aria-label="Asset purchase price">
                <mat-error *ngIf="assetForm.get('purchasePrice')?.hasError('required')">
                  Purchase price is required
                </mat-error>
                <mat-error *ngIf="assetForm.get('purchasePrice')?.hasError('min')">
                  Purchase price must be greater than 0
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-purchase-date">Purchase Date *</mat-label>
                <input matInput id="asset-purchase-date" [matDatepicker]="purchaseDatePicker" formControlName="purchaseDate" aria-label="Asset purchase date">
                <mat-datepicker-toggle matSuffix [for]="purchaseDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #purchaseDatePicker></mat-datepicker>
                <mat-error *ngIf="assetForm.get('purchaseDate')?.hasError('required')">
                  Purchase date is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-warranty-date">Warranty Expiry Date</mat-label>
                <input matInput id="asset-warranty-date" [matDatepicker]="warrantyDatePicker" formControlName="warrantyExpiryDate" aria-label="Asset warranty expiry date">
                <mat-datepicker-toggle matSuffix [for]="warrantyDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #warrantyDatePicker></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="form-row" *ngIf="isEditMode">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-status">Status *</mat-label>
                <mat-select id="asset-status" formControlName="status" aria-label="Asset status">
                  <mat-option value="Available">Available</mat-option>
                  <mat-option value="Assigned">Assigned</mat-option>
                  <mat-option value="Maintenance">Maintenance</mat-option>
                  <mat-option value="Retired">Retired</mat-option>
                </mat-select>
                <mat-error *ngIf="assetForm.get('status')?.hasError('required')">
                  Status is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-assigned">Assigned To</mat-label>
                <mat-select id="asset-assigned" formControlName="assignedToUserId" aria-label="Asset assigned to">
                  <mat-option [value]="null">Not Assigned</mat-option>
                  <mat-option *ngFor="let user of users" [value]="user.id">
                    {{ user.firstName }} {{ user.lastName }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-location">Location *</mat-label>
                <mat-select id="asset-location" formControlName="location" aria-label="Asset location">
                  <mat-option *ngFor="let location of locations" [value]="location">
                    {{ location }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="assetForm.get('location')?.hasError('required')">
                  Location is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label for="asset-condition">Condition *</mat-label>
                <mat-select id="asset-condition" formControlName="condition" aria-label="Asset condition">
                  <mat-option value="Excellent">Excellent</mat-option>
                  <mat-option value="Good">Good</mat-option>
                  <mat-option value="Fair">Fair</mat-option>
                  <mat-option value="Poor">Poor</mat-option>
                  <mat-option value="Damaged">Damaged</mat-option>
                </mat-select>
                <mat-error *ngIf="assetForm.get('condition')?.hasError('required')">
                  Condition is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-button type="button" routerLink="/assets" class="cancel-btn">
                <mat-icon>cancel</mat-icon>
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="assetForm.invalid || loading" class="submit-btn">
                <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
                <mat-icon *ngIf="!loading">{{ isEditMode ? 'save' : 'add' }}</mat-icon>
                {{ isEditMode ? 'Update Asset' : 'Create Asset' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .asset-form-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    .asset-form {
      margin-top: 20px;
    }

    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      flex: 1;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-btn {
      color: #666;
    }

    .submit-btn {
      min-width: 150px;
    }

    .submit-btn mat-spinner {
      margin-right: 8px;
    }

    .submit-btn mat-icon {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .half-width {
        width: 100%;
        margin-bottom: 20px;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class AssetFormComponent implements OnInit {
  assetForm: FormGroup;
  isEditMode = false;
  assetId: number | null = null;
  loading = false;
  categories: string[] = [];
  locations: string[] = [];
  users: User[] = [];

  constructor(
    private fb: FormBuilder,
    private assetService: AssetService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.assetForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      assetTag: ['', Validators.required],
      category: ['', Validators.required],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      serialNumber: ['', Validators.required],
      purchasePrice: [0, [Validators.required, Validators.min(0)]],
      purchaseDate: ['', Validators.required],
      warrantyExpiryDate: [''],
      status: ['Available', Validators.required],
      location: ['', Validators.required],
      condition: ['Good', Validators.required],
      assignedToUserId: [null]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadLocations();
    this.loadUsers();

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.assetId = +params['id'];
        this.loadAsset();
      }
    });
  }

  loadAsset(): void {
    if (this.assetId) {
      this.loading = true;
      this.assetService.getAssetById(this.assetId).subscribe({
        next: (asset: Asset) => {
          this.assetForm.patchValue({
            name: asset.name,
            description: asset.description,
            assetTag: asset.assetTag,
            category: asset.category,
            brand: asset.brand,
            model: asset.model,
            serialNumber: asset.serialNumber,
            purchasePrice: asset.purchasePrice,
            purchaseDate: new Date(asset.purchaseDate),
            warrantyExpiryDate: asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate) : null,
            status: asset.status,
            location: asset.location,
            condition: asset.condition,
            assignedToUserId: asset.assignedToUserId
          });
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading asset:', error);
          this.snackBar.open('Error loading asset', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  loadCategories(): void {
    this.assetService.getAssetCategories().subscribe({
      next: (categories: string[]) => {
        this.categories = categories;
        console.log('Loaded categories:', this.categories);
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        // Fallback categories
        this.categories = ['Computer', 'Phone', 'Tablet', 'Monitor', 'Printer', 'Furniture', 'Vehicle', 'Other'];
        console.log('Using fallback categories:', this.categories);
      }
    });
  }

  loadLocations(): void {
    this.assetService.getAssetLocations().subscribe({
      next: (locations: string[]) => {
        this.locations = locations;
      },
      error: (error: any) => {
        console.error('Error loading locations:', error);
        // Fallback locations
        this.locations = ['Office A', 'Office B', 'Warehouse', 'Remote', 'Storage'];
      }
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.users = [];
      }
    });
  }

  onSubmit(): void {
    if (this.assetForm.valid) {
      this.loading = true;
      const formValue = this.assetForm.value;

      // Format dates
      const assetData = {
        ...formValue,
        purchaseDate: this.formatDate(formValue.purchaseDate),
        warrantyExpiryDate: formValue.warrantyExpiryDate ? this.formatDate(formValue.warrantyExpiryDate) : null
      };

      if (this.isEditMode && this.assetId) {
        this.assetService.updateAsset(this.assetId, assetData).subscribe({
          next: (asset: Asset) => {
            this.snackBar.open('Asset updated successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/assets', asset.id]);
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error updating asset:', error);
            this.snackBar.open('Error updating asset', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      } else {
        this.assetService.createAsset(assetData).subscribe({
          next: (asset: Asset) => {
            this.snackBar.open('Asset created successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/assets', asset.id]);
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error creating asset:', error);
            this.snackBar.open('Error creating asset', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      }
    }
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }
} 