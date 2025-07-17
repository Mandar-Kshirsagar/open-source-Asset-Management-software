import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SharedMaterialModule } from '../../shared/material.module';
import { AppConfigService, AppSettings } from '../../services/app-config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedMaterialModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  appSettings: AppSettings | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private appConfigService: AppConfigService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      companyName: ['', Validators.required],
      defaultTheme: ['light', Validators.required],
      defaultLanguage: ['en-US', Validators.required]
    });

    this.appConfigService.appSettings$.pipe(filter((settings): settings is AppSettings => settings !== null)).subscribe((settings: AppSettings) => {
      this.appSettings = settings;
      this.settingsForm.patchValue({
        companyName: settings?.companyName,
        defaultTheme: settings?.defaultTheme,
        defaultLanguage: settings?.defaultLanguage
      });
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
    }
  }

  uploadLogo(): void {
    if (this.selectedFile) {
      this.appConfigService.uploadCompanyLogo(this.selectedFile).subscribe({
        next: (logoUrl: string) => {
          this.snackBar.open('Logo uploaded successfully!', 'Close', { duration: 3000 });
          this.selectedFile = null; // Clear selected file
        },
        error: (err: any) => {
          console.error('Error uploading logo:', err);
          this.snackBar.open('Failed to upload logo.', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.snackBar.open('No file selected.', 'Close', { duration: 3000 });
    }
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      this.appConfigService.updateAppSettings(this.settingsForm.value).subscribe({
        next: () => {
          this.snackBar.open('Settings saved successfully!', 'Close', { duration: 3000 });
        },
        error: (err: any) => {
          console.error('Error saving settings:', err);
          this.snackBar.open('Failed to save settings.', 'Close', { duration: 3000 });
        }
      });
    }
  }
} 