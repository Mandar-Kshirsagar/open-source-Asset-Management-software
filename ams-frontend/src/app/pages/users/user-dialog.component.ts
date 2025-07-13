import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { User } from '../../models/user.model';

export interface UserDialogData {
  mode: 'add' | 'edit' | 'view';
  user?: User;
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'add' ? 'Add User' : data.mode === 'edit' ? 'Edit User' : 'User Details' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="userForm" *ngIf="data.mode !== 'view'; else viewTemplate">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>First Name</mat-label>
          <input matInput formControlName="firstName">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Last Name</mat-label>
          <input matInput formControlName="lastName">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="Admin">Admin</mat-option>
            <mat-option value="Manager">Manager</mat-option>
            <mat-option value="User">User</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-checkbox formControlName="isActive">Active</mat-checkbox>
        <mat-form-field *ngIf="data.mode === 'add'" appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password">
        </mat-form-field>
      </form>
      <ng-template #viewTemplate>
        <div class="view-field"><strong>First Name:</strong> {{ data.user?.firstName }}</div>
        <div class="view-field"><strong>Last Name:</strong> {{ data.user?.lastName }}</div>
        <div class="view-field"><strong>Email:</strong> {{ data.user?.email }}</div>
        <div class="view-field"><strong>Role:</strong> {{ data.user?.role }}</div>
        <div class="view-field"><strong>Status:</strong> {{ data.user?.isActive ? 'Active' : 'Inactive' }}</div>
        <div class="view-field"><strong>Created:</strong> {{ data.user?.createdAt | date:'medium' }}</div>
      </ng-template>
    </mat-dialog-content>
    <mat-dialog-actions align="end" *ngIf="data.mode !== 'view'">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="userForm.invalid" [mat-dialog-close]="userForm.value">
        {{ data.mode === 'add' ? 'Add' : 'Save' }}
      </button>
    </mat-dialog-actions>
    <mat-dialog-actions align="end" *ngIf="data.mode === 'view'">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .view-field { margin-bottom: 12px; }
    mat-dialog-content { min-width: 320px; }
  `]
})
export class UserDialogComponent {
  userForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      firstName: [data.user?.firstName || '', Validators.required],
      lastName: [data.user?.lastName || '', Validators.required],
      email: [data.user?.email || '', [Validators.required, Validators.email]],
      role: [data.user?.role || 'User', Validators.required],
      isActive: [data.user?.isActive ?? true],
      password: ['']
    });
    if (data.mode !== 'add') {
      this.userForm.get('password')?.disable();
    }
    if (data.mode === 'view') {
      this.userForm.disable();
    }
  }
} 