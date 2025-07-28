import { computed, Injectable, signal } from '@angular/core';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ScreenRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime = 0;
  private pausedTime = 0;
  private durationTimer: ReturnType<typeof setInterval> | null = null;

  // Modern Angular Signals for reactive state
  private readonly _isRecording = signal(false);
  private readonly _isPaused = signal(false);
  private readonly _duration = signal(0);
  private readonly _error = signal<string | undefined>(undefined);

  // Public computed signal for the complete recording state
  readonly recordingState = computed<RecordingState>(() => ({
    isRecording: this._isRecording(),
    isPaused: this._isPaused(),
    duration: this._duration(),
    error: this._error(),
  }));

  // Individual signal getters for convenience
  readonly isRecording = this._isRecording.asReadonly();
  readonly isPaused = this._isPaused.asReadonly();
  readonly duration = this._duration.asReadonly();
  readonly error = this._error.asReadonly();

  async startRecording(): Promise<void> {
    try {
      // Request screen capture
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Initialize MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      this.recordedChunks = [];
      this.startTime = Date.now();
      this.pausedTime = 0;

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        this.downloadRecording();
        this.cleanup();
      };

      // Handle stream end (user stops sharing)
      this.stream.getVideoTracks()[0].onended = () => {
        this.stopRecording();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second

      this._isRecording.set(true);
      this._isPaused.set(false);
      this._duration.set(0);
      this._error.set(undefined);
      this.startDurationTimer();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error starting recording:', error);
      this._isRecording.set(false);
      this._isPaused.set(false);
      this._duration.set(0);
      this._error.set(
        'Fehler beim Starten der Aufnahme. Bitte stellen Sie sicher, dass Sie die Berechtigung erteilt haben.',
      );
    }
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.pausedTime = Date.now();
      this.stopDurationTimer();
      this._isPaused.set(true);
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.startTime += Date.now() - this.pausedTime;
      this.startDurationTimer();
      this._isPaused.set(false);
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.stopDurationTimer();
    }
  }

  private startDurationTimer(): void {
    this.durationTimer = setInterval(() => {
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      this._duration.set(duration);
    }, 1000);
  }

  private stopDurationTimer(): void {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }

  private downloadRecording(): void {
    if (this.recordedChunks.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('No recorded data available');
      return;
    }

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stopDurationTimer();
    this._isRecording.set(false);
    this._isPaused.set(false);
    this._duration.set(0);
    this._error.set(undefined);
  }

  isRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
