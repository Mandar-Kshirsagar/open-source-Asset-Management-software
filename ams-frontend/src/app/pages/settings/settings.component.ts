import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedMaterialModule } from '../../shared/material.module';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedMaterialModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  // Basic settings properties
  darkMode: boolean = false;
  notifications: boolean = true;

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
  }

  toggleNotifications() {
    this.notifications = !this.notifications;
  }
} 