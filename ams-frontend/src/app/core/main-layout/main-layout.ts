import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SharedMaterialModule } from '../../shared/material.module';
import { HeaderComponent } from '../../shared/header/header.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule,
    HeaderComponent,
    BreadcrumbComponent
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit {
  currentUser: any;
  breadcrumbItems: BreadcrumbItem[] = [];
  actionButtonText: string = '';
  actionButtonIcon: string = '';
  hasAdminRole: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get current user
    this.currentUser = this.authService.getCurrentUser();
    this.hasAdminRole = this.currentUser && this.currentUser.role === 'Admin';
    
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.hasAdminRole = user ? user.role === 'Admin' : false;
    });

    // Update breadcrumbs on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateBreadcrumbs();
      this.updateActionButton();
    });
  }

  updateBreadcrumbs() {
    const url = this.router.url;
    this.breadcrumbItems = [{ label: 'Home', link: '/' }];
    
    if (url.includes('/dashboard')) {
      this.breadcrumbItems.push({ label: 'Dashboard', icon: 'dashboard' });
    } else if (url.includes('/assets')) {
      this.breadcrumbItems.push({ label: 'Assets', icon: 'inventory' });
      if (url.includes('/new')) {
        this.breadcrumbItems.push({ label: 'New Asset' });
      } else if (url.includes('/edit')) {
        this.breadcrumbItems.push({ label: 'Edit Asset' });
      } else if (url.match(/\/assets\/[\w-]+$/)) {
        this.breadcrumbItems.push({ label: 'Asset Details' });
      }
    } else if (url.includes('/users')) {
      this.breadcrumbItems.push({ label: 'Users', icon: 'people' });
    } else if (url.includes('/reports')) {
      this.breadcrumbItems.push({ label: 'Reports', icon: 'analytics' });
    }
  }

  updateActionButton() {
    const url = this.router.url;
    
    if (url.includes('/dashboard')) {
      this.actionButtonText = 'New Asset';
      this.actionButtonIcon = 'add';
    } else if (url.includes('/assets') && !url.includes('/new') && !url.includes('/edit')) {
      this.actionButtonText = 'New Asset';
      this.actionButtonIcon = 'add';
    } else if (url.includes('/users')) {
      this.actionButtonText = 'New User';
      this.actionButtonIcon = 'person_add';
    } else if (url.includes('/reports')) {
      this.actionButtonText = 'Refresh Reports';
      this.actionButtonIcon = 'refresh';
    } else {
      this.actionButtonText = '';
      this.actionButtonIcon = '';
    }
  }

  onActionClick() {
    const url = this.router.url;
    
    if (url.includes('/dashboard') || url.includes('/assets')) {
      this.router.navigate(['/assets/new']);
    } else if (url.includes('/users')) {
      // This would typically open a dialog to create a new user
      console.log('Open new user dialog');
    } else if (url.includes('/reports')) {
      // This would typically refresh reports data
      console.log('Refresh reports');
    }
  }
}
