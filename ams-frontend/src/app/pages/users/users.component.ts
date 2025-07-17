import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedMaterialModule } from '../../shared/material.module';
import { HeaderComponent } from '../../shared/header/header.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, startWith, switchMap, catchError, of } from 'rxjs';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { UserDialogComponent, UserDialogData } from './user-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users',
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
    <div class="users-container">
      <div class="users-content">
        <h1 class="page-title">User Management</h1>

        <!-- Filters and Actions -->
        <div class="filters-container">
          <div class="filter-left">
            <mat-form-field appearance="outline" class="search-input">
              <mat-label>Search Users</mat-label>
              <input matInput [(ngModel)]="searchTerm" name="searchTerm" (input)="onSearch()" placeholder="Search by name or email...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          </div>
          
          <div class="filter-right">
            <mat-form-field appearance="outline" class="filter-select">
              <mat-label>Filter by Role</mat-label>
              <mat-select [(ngModel)]="selectedRole" name="selectedRole" (selectionChange)="onRoleFilter()">
                <mat-option value="">All Roles</mat-option>
                <mat-option value="Admin">Admin</mat-option>
                <mat-option value="Manager">Manager</mat-option>
                <mat-option value="User">User</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-icon-button matTooltip="Refresh" (click)="loadUsers()">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </div>

                    <!-- Users Table -->
        <div class="table-container" *ngIf="!loading; else loadingTemplate">
          <table mat-table [dataSource]="users" class="users-table">
                <!-- Name Column -->
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let user">
                    <div class="user-info">
                      <div class="user-avatar">
                        <mat-icon>account_circle</mat-icon>
                      </div>
                      <div class="user-details">
                        <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                        <div class="user-email">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Role Column -->
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Role</th>
                  <td mat-cell *matCellDef="let user">
                    <mat-chip [class]="'role-' + user.role.toLowerCase()">
                      {{ user.role }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let user">
                    <mat-chip [class]="user.isActive ? 'status-active' : 'status-inactive'">
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Created Date Column -->
                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef>Created</th>
                  <td mat-cell *matCellDef="let user">
                    {{ user.createdAt | date:'mediumDate' }}
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let user">
                    <button mat-icon-button [matMenuTriggerFor]="actionMenu" (click)="$event.stopPropagation()">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #actionMenu="matMenu">
                      <button mat-menu-item (click)="viewUser(user)">
                        <mat-icon>visibility</mat-icon>
                        <span>View Details</span>
                      </button>
                      <button mat-menu-item (click)="editUser(user)" *ngIf="hasRole('Admin')">
                        <mat-icon>edit</mat-icon>
                        <span>Edit User</span>
                      </button>
                      <button mat-menu-item (click)="toggleUserStatus(user)" *ngIf="hasRole('Admin')">
                        <mat-icon>{{ user.isActive ? 'block' : 'check_circle' }}</mat-icon>
                        <span>{{ user.isActive ? 'Deactivate' : 'Activate' }}</span>
                      </button>
                      <button mat-menu-item (click)="deleteUser(user)" *ngIf="hasRole('Admin') && user.id !== currentUser?.id">
                        <mat-icon>delete</mat-icon>
                        <span>Delete User</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <!-- No Data Template -->
          <div *ngIf="users.length === 0" class="no-data">
            <mat-icon class="no-data-icon">people_outline</mat-icon>
            <h3>No users found</h3>
            <p>{{ searchTerm ? 'No users match your search criteria.' : 'No users have been added yet.' }}</p>
            <button mat-raised-button color="primary" (click)="openUserDialog()" *ngIf="!searchTerm && hasRole('Admin')">
              <mat-icon>person_add</mat-icon>
              Add First User
            </button>
          </div>
        </div>

        <!-- Loading Template -->
        <ng-template #loadingTemplate>
          <div class="loading-container">
            <mat-progress-spinner mode="indeterminate" diameter="60"></mat-progress-spinner>
            <p>Loading users...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .users-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f5f5f5;
    }

    .users-content {
      flex: 1;
      padding: 24px;
      overflow: auto;
      background: #f5f5f5;
    }

    .page-header h1 {
      margin: 0 0 24px 0;
      color: #333;
      font-size: 28px;
      font-weight: 500;
    }

    /* Filters */
    .filters-container {
      background: white;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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

    .search-input {
      width: 300px;
    }

    .filter-select {
      width: 160px;
    }

    /* Table */
    .table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: auto;
    }

    .users-table {
      width: 100%;
      background: white;
    }

    .users-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #dee2e6;
    }

    .users-table tr:hover {
      background-color: #f8f9fa;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #666;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-email {
      font-size: 0.875rem;
      color: #666;
    }

    .role-admin {
      background-color: #ffebee !important;
      color: #c62828 !important;
    }

    .role-manager {
      background-color: #e3f2fd !important;
      color: #1976d2 !important;
    }

    .role-user {
      background-color: #e8f5e8 !important;
      color: #2e7d32 !important;
    }

    .status-active {
      background-color: #e8f5e8 !important;
      color: #2e7d32 !important;
    }

    .status-inactive {
      background-color: #ffebee !important;
      color: #c62828 !important;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .no-users {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-users mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 20px;
      color: #ccc;
    }

    .no-users h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .no-users p {
      margin: 0;
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
      .filters {
        flex-direction: column;
      }

      .filters mat-form-field {
        width: 100%;
      }

      .header {
        flex-direction: column;
        gap: 20px;
        align-items: flex-start;
      }
    }
  `]
})
export class UsersComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  users: User[] = [];
  loading = false;
  searchTerm = '';
  selectedRole = '';
  displayedColumns: string[] = ['name', 'role', 'status', 'createdAt', 'actions'];
  private destroy$ = new Subject<void>();
  
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Users', icon: 'people' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Use setTimeout to defer the data loading to the next change detection cycle
    setTimeout(() => {
      this.loadUsers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    this.cdr.markForCheck();
    
    this.userService.getAllUsers().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.userService.searchUsers(this.searchTerm).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (users) => {
          this.users = users;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error searching users:', error);
        }
      });
    } else {
      this.loadUsers();
    }
  }

  onRoleFilter(): void {
    if (this.selectedRole) {
      this.userService.getUsersByRole(this.selectedRole).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (users) => {
          this.users = users;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error filtering users:', error);
        }
      });
    } else {
      this.loadUsers();
    }
  }

  openUserDialog(user?: User, mode: 'add' | 'edit' | 'view' = 'add'): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      data: { mode, user } as UserDialogData,
      width: '400px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && mode === 'add') {
        // Add user
        this.loading = true;
        this.userService.createUser(result).subscribe({
          next: () => {
            this.snackBar.open('User added successfully', 'Close', { duration: 3000 });
            this.loadUsers();
          },
          error: (error) => {
            this.snackBar.open('Failed to add user', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      } else if (result && mode === 'edit' && user) {
        // Edit user
        this.loading = true;
        this.userService.updateUser(user.id, { ...result, password: undefined }).subscribe({
          next: () => {
            this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
            this.loadUsers();
          },
          error: (error) => {
            this.snackBar.open('Failed to update user', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      }
    });
  }

  viewUser(user: User): void {
    this.openUserDialog(user, 'view');
  }

  editUser(user: User): void {
    this.openUserDialog(user, 'edit');
  }

  toggleUserStatus(user: User): void {
    const updated = { ...user, isActive: !user.isActive };
    this.loading = true;
    this.userService.updateUser(user.id, updated).subscribe({
      next: () => {
        this.snackBar.open(`User ${updated.isActive ? 'activated' : 'deactivated'} successfully`, 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open('Failed to update user status', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete user "${user.firstName} ${user.lastName}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
      } as ConfirmDialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
            this.loadUsers();
          },
          error: (error) => {
            this.snackBar.open('Failed to delete user', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      }
    });
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  logout(): void {
    this.authService.logout();
  }
}