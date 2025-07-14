import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SharedMaterialModule } from '../../shared/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedMaterialModule
  ],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <mat-icon class="app-logo">inventory</mat-icon>
          <h1 class="app-title">Asset Manager</h1>
          <p class="app-subtitle">Please sign in to continue</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Username</mat-label>
            <input matInput [(ngModel)]="loginRequest.username" name="username" required>
            <mat-icon matSuffix>person</mat-icon>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" [(ngModel)]="loginRequest.password" name="password" required>
            <mat-icon matSuffix>lock</mat-icon>
          </mat-form-field>
          
          <button mat-raised-button color="primary" type="submit" class="login-button" [disabled]="isLoading">
            <mat-icon *ngIf="isLoading">hourglass_empty</mat-icon>
            <mat-icon *ngIf="!isLoading">login</mat-icon>
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .login-card {
      max-width: 420px;
      width: 100%;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .login-header {
      text-align: center;
      padding: 40px 40px 20px;
      background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
      color: white;
    }
    
    .app-logo {
      font-size: 48px;
      color: #ff6b35;
      margin-bottom: 16px;
    }
    
    .app-title {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: white;
    }
    
    .app-subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }
    
    .login-form {
      padding: 40px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }
    
    .login-button {
      width: 100%;
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%) !important;
      border-radius: 8px;
      margin-top: 8px;
    }
    
    .login-button mat-icon {
      margin-right: 8px;
    }
    
    .login-button:disabled {
      background: #cccccc !important;
      color: #666666 !important;
    }
    
    /* Responsive */
    @media (max-width: 480px) {
      .login-card {
        margin: 20px;
        border-radius: 12px;
      }
      
      .login-header {
        padding: 30px 20px 15px;
      }
      
      .login-form {
        padding: 30px 20px;
      }
      
      .app-title {
        font-size: 24px;
      }
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

    this.isLoading = true;
    
    this.authService.login(this.loginRequest).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Login failed. Please check your credentials.', 'Close', { duration: 3000 });
      }
    });
  }
} 