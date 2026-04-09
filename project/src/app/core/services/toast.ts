import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  kind: ToastKind;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private hideTimer: number | null = null;

  private state = signal<ToastState>({
    message: '',
    kind: 'info',
    visible: false,
  });

  readonly toast = this.state.asReadonly();

  show(message: string, kind: ToastKind = 'info', ms = 3000): void {
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

