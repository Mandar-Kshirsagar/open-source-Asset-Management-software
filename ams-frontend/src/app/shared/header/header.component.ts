import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedMaterialModule } from '../material.module';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { AppConfigService, AppSettings } from '../../services/app-config.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule
  ],
  template: `
    <mat-toolbar color="primary" class="modern-toolbar">
      <img *ngIf="appSettings?.companyLogoUrl" [src]="appSettings?.companyLogoUrl" alt="Company Logo" class="app-logo-img">
      <mat-icon class="app-logo" *ngIf="!appSettings?.companyLogoUrl">inventory</mat-icon>
      <span class="app-title">{{ appSettings?.companyName || 'Asset Manager' }}</span>
      <span class="toolbar-spacer"></span>
      
      <!-- Navigation Icons -->
      <button mat-icon-button matTooltip="Dashboard" routerLink="/dashboard">
        <mat-icon>dashboard</mat-icon>
      </button>
      <button mat-icon-button matTooltip="Assets" routerLink="/assets">
        <mat-icon>inventory</mat-icon>
      </button>
      <button mat-icon-button matTooltip="Users" routerLink="/users" *ngIf="hasRole('Admin')">
        <mat-icon>people</mat-icon>
      </button>
      <button mat-icon-button matTooltip="Reports" routerLink="/reports">
        <mat-icon>analytics</mat-icon>
      </button>
      
      <!-- Search Bar (if enabled) -->
      <mat-form-field class="header-search" appearance="outline" *ngIf="showSearch">
        <mat-label>{{ searchPlaceholder }}</mat-label>
        <input matInput [value]="searchTerm" (input)="onSearchChange($event)" [placeholder]="searchPlaceholder">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      
      <!-- Action Button (if provided) -->
      <button mat-raised-button color="accent" class="action-button" 
              *ngIf="actionButtonText" (click)="onActionClick()">
        <mat-icon>{{ actionButtonIcon }}</mat-icon>
        {{ actionButtonText }}
      </button>
      
      <!-- User Menu -->
      <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-avatar">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <div class="user-info" *ngIf="currentUser">
          <span class="user-name">{{ currentUser.firstName }} {{ currentUser.lastName }}</span>
          <span class="user-email">{{ currentUser.email }}</span>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item routerLink="/profile">
          <mat-icon>person</mat-icon>
          Profile
        </button>
        <button mat-menu-item routerLink="/settings">
          <mat-icon>settings</mat-icon>
          Settings
        </button>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          Logout
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .modern-toolbar {
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
      margin-right: 16px;
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

    .action-button {
      margin-left: 16px;
      background-color: #4caf50 !important;
      color: white !important;
    }

    .user-avatar {
      margin-left: 16px;
    }

    .user-info {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .user-name {
      display: block;
      font-weight: 500;
      color: #333;
    }

    .user-email {
      display: block;
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-search {
        display: none;
      }
      
      .app-title {
        display: none;
      }
    }

    .app-logo-img {
      height: 40px; /* Adjust as needed */
      margin-right: 8px;
    }`
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  @Input() showSearch = false;
  @Input() searchTerm = '';
  @Input() searchPlaceholder = 'Search...';
  @Input() actionButtonText = '';
  @Input() actionButtonIcon = 'add';
  
  @Output() searchChange = new EventEmitter<string>();
  @Output() actionClick = new EventEmitter<void>();

  appSettings: AppSettings | null = null;
  private appSettingsSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService, 
    private appConfigService: AppConfigService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.appSettingsSubscription = this.appConfigService.appSettings$.subscribe(settings => {
      this.appSettings = settings;
      // Trigger change detection to prevent ExpressionChangedAfterItHasBeenCheckedError
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.appSettingsSubscription?.unsubscribe();
  }

  onSearchChange(event: any): void {
    this.searchChange.emit(event.target.value);
  }

  onActionClick(): void {
    this.actionClick.emit();
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  logout(): void {
    this.authService.logout();
  }
}