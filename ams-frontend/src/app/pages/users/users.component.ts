import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, startWith, switchMap, catchError, of } from 'rxjs';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule
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

    <div class="users-container">
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
            <a mat-list-item routerLink="/users" routerLinkActive="active" *ngIf="hasRole('Admin')">
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
          <div class="users-content">
            <div class="header">
              <h1>User Management</h1>
              <button mat-raised-button color="primary" (click)="openUserDialog()" *ngIf="hasRole('Admin')">
                <mat-icon>person_add</mat-icon>
                Add User
              </button>
            </div>

            <div class="filters">
              <mat-form-field appearance="outline">
                <mat-label for="user-search">Search Users</mat-label>
                <input matInput id="user-search" [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Search by name or email..." aria-label="Search users">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label for="role-filter">Filter by Role</mat-label>
                <mat-select id="role-filter" [(ngModel)]="selectedRole" (selectionChange)="onRoleFilter()" aria-label="Filter by role">
                  <mat-option value="">All Roles</mat-option>
                  <mat-option value="Admin">Admin</mat-option>
                  <mat-option value="Manager">Manager</mat-option>
                  <mat-option value="User">User</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="users-table-container">
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

              <div *ngIf="loading" class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Loading users...</p>
              </div>

              <div *ngIf="!loading && users.length === 0" class="no-users">
                <mat-icon>people_outline</mat-icon>
                <h3>No users found</h3>
                <p>Try adjusting your search criteria or add a new user.</p>
              </div>
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

    .users-container {
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
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .filters mat-form-field {
      min-width: 200px;
    }

    .users-table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .users-table {
      width: 100%;
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

  openUserDialog(user?: User): void {
    // TODO: Implement user dialog
    console.log('Open user dialog:', user);
  }

  viewUser(user: User): void {
    // TODO: Implement view user details
    console.log('View user:', user);
  }

  editUser(user: User): void {
    // TODO: Implement edit user
    console.log('Edit user:', user);
  }

  toggleUserStatus(user: User): void {
    // TODO: Implement toggle user status
    console.log('Toggle user status:', user);
  }

  deleteUser(user: User): void {
    // TODO: Implement delete user with confirmation
    console.log('Delete user:', user);
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  logout(): void {
    this.authService.logout();
  }
} 