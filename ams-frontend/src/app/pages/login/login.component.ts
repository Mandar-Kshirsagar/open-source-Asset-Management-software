import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Asset Management System</mat-card-title>
          <mat-card-subtitle>Please sign in to continue</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label for="username">Username</mat-label>
              <input matInput id="username" [(ngModel)]="loginRequest.username" name="username" required aria-label="Username">
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label for="password">Password</mat-label>
              <input matInput id="password" type="password" [(ngModel)]="loginRequest.password" name="password" required aria-label="Password">
            </mat-form-field>
            
            <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="isLoading">
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    
    .login-card {
      max-width: 400px;
      width: 100%;
      padding: 20px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    mat-card-header {
      margin-bottom: 20px;
    }
    
    mat-card-title {
      font-size: 24px;
      font-weight: 500;
    }
  `]
})
export class LoginComponent {
  loginRequest: LoginRequest = {
    username: '',
    password: ''
  };
  
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    if (!this.loginRequest.username || !this.loginRequest.password) {
      this.snackBar.open('Please enter both username and password', 'Close', { duration: 3000 });
      return;
    }

    setTimeout(() => {
      this.isLoading = true;
    });
    
    this.authService.login(this.loginRequest).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open('Login failed. Please check your credentials.', 'Close', { duration: 3000 });
      }
    });
  }
} 