import { Component, computed, inject } from '@angular/core';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.html',
  styleUrl: './notification.css',
})
export class NotificationComponent {
  private notificationService = inject(NotificationService);
  notification = this.notificationService.notification;

  notificationClass = computed(() => {
    const n = this.notification();
    return `notification notification--${n.type} ${n.visible ? 'notification--visible' : ''}`;
  });

  hide(): void {
    this.notificationService.hide();
  }
}

