import { NgModule } from '@angular/core';

// Core Material modules used across the application
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';

// Table and pagination modules
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

// Dialog and overlay modules
import { MatDialogModule } from '@angular/material/dialog';

// Chips and other display modules
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

// Form controls
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Advanced components
import { MatTabsModule } from '@angular/material/tabs';

const MATERIAL_MODULES = [
  // Core UI
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  
  // Forms
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatDatepickerModule,
  MatNativeDateModule,
  
  // Feedback
  MatProgressSpinnerModule,
  MatSnackBarModule,
  
  // Navigation
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  MatMenuModule,
  MatTabsModule,
  
  // Data display
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatChipsModule,
  MatDividerModule,
  
  // Overlays
  MatDialogModule,
];

@NgModule({
  imports: MATERIAL_MODULES,
  exports: MATERIAL_MODULES,
})
export class SharedMaterialModule {}