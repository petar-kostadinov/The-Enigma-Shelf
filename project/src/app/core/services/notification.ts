import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'success' | 'error' | 'info';

export interface NotificationState {
  message: string;
  kind: NotificationKind;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private hideTimer: number | null = null;

  private state = signal<NotificationState>({
    message: '',
    kind: 'info',
    visible: false,
  });

  readonly notification = this.state.asReadonly();

  show(message: string, kind: NotificationKind = 'info', ms = 3000): void {
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.state.set({ message, kind, visible: true });

    this.hideTimer = window.setTimeout(() => {
      this.hide();
    }, ms);
  }

  hide(): void {
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.state.update((s) => ({ ...s, visible: false }));
  }
}

