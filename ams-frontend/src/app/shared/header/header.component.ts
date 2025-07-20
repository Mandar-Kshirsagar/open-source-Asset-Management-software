import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    RouterModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  @Input() currentUser: User | null = null;
  @Input() actionButtonText: string = '';
  @Input() actionButtonIcon: string = '';
  @Output() actionClick = new EventEmitter<void>();

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.currentUser) {
      this.authService.currentUser$.subscribe((user: User | null) => {
        this.currentUser = user;
        this.cdr.detectChanges();
      });
    }
  }

  onActionClick(): void {
    this.actionClick.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}