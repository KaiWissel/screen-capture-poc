import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ScreenRecordingService } from './services/screen-recording';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly screenRecordingService = inject(ScreenRecordingService);
  
  // Use signals from the service directly
  readonly recordingState = this.screenRecordingService.recordingState;
  readonly isRecording = this.screenRecordingService.isRecording;
  readonly isPaused = this.screenRecordingService.isPaused;
  readonly duration = this.screenRecordingService.duration;
  readonly error = this.screenRecordingService.error;
  
  readonly isSupported = this.screenRecordingService.isRecordingSupported();
  
  // Computed signal for status text
  readonly statusText = computed(() => {
    if (!this.isRecording()) {
      return 'Bereit zur Aufnahme';
    }
    if (this.isPaused()) {
      return 'Aufnahme pausiert';
    }
    return 'Aufnahme läuft';
  });

  async startRecording(): Promise<void> {
    await this.screenRecordingService.startRecording();
  }

  togglePause(): void {
    if (this.isPaused()) {
      this.screenRecordingService.resumeRecording();
    } else {
      this.screenRecordingService.pauseRecording();
    }
  }

  stopRecording(): void {
    this.screenRecordingService.stopRecording();
  }

  formatDuration(seconds: number): string {
    return this.screenRecordingService.formatDuration(seconds);
  }
}
