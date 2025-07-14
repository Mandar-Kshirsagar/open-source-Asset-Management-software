import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedMaterialModule } from '../material.module';

export interface BreadcrumbItem {
  label: string;
  link?: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule
  ],
  template: `
    <div class="breadcrumb">
      <mat-icon>home</mat-icon>
      <ng-container *ngFor="let item of items; let last = last">
        <span class="breadcrumb-separator">></span>
        <mat-icon *ngIf="item.icon" class="breadcrumb-icon">{{ item.icon }}</mat-icon>
        <a *ngIf="item.link && !last" [routerLink]="item.link" class="breadcrumb-link">{{ item.label }}</a>
        <span *ngIf="!item.link || last" class="breadcrumb-current">{{ item.label }}</span>
      </ng-container>
    </div>
  `,
  styles: [`
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

    .breadcrumb-icon {
      margin-right: 4px !important;
      font-size: 16px !important;
    }

    .breadcrumb-separator {
      margin: 0 8px;
      color: #999;
    }

    .breadcrumb-link {
      color: #3f51b5;
      text-decoration: none;
    }

    .breadcrumb-link:hover {
      text-decoration: underline;
    }

    .breadcrumb-current {
      font-weight: 500;
      color: #333;
    }
  `]
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}