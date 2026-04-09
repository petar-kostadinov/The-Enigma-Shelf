import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  private toastService = inject(ToastService);
  toast = this.toastService.toast;

  toastClass = computed(() => {
    const t = this.toast();
    return `toast toast--${t.kind} ${t.visible ? 'toast--visible' : ''}`;
  });

  hide(): void {
    this.toastService.hide();
  }
}

