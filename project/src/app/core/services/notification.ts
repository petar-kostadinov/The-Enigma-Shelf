import { Injectable, signal } from '@angular/core';
import { NotificationState } from '../../shared/interfaces/notification';


@Injectable({ providedIn: 'root' })
export class NotificationService {
  private hideTimer: number | null = null;

  private state = signal<NotificationState>({
    message: '',
    type: 'info',
    visible: false,
  });

  readonly notification = this.state.asReadonly();

  show(message: string, type: NotificationState['type'], ms = 3000): void {
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.state.set({ message, type, visible: true });

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

