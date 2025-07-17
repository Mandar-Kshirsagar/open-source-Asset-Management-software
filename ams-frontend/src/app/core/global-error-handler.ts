import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private zone: NgZone) {}

  handleError(error: any): void {
    this.zone.run(() => {
      if (error instanceof HttpErrorResponse) {
        console.error('Backend error:', error.message);
        // Here you could add logic to show a user-friendly message
      } else {
        console.error('An unexpected error occurred:', error);
        // Here you could add logic to show a user-friendly message
      }
    });
  }
}
