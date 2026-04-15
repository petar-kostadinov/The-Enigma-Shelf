import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private router = inject(Router);
  private notification = inject(NotificationService);
  authService = inject(AuthService);

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.clearSession();
        this.notification.show('You have been logged out.', 'success');
        this.router.navigate(['/home']);
      },
      error: () => {
        this.authService.clearSession();
        this.notification.show('You have been logged out.', 'success');
        this.router.navigate(['/home']);
      },
    });
  }

  closeProfileMenu(menu: HTMLDetailsElement): void {
    menu.open = false;
  }

  onSearch(raw: string): void {
    const search = raw.trim();
    const path = this.router.url.split('?')[0];
    const allowed = path === '/home' || path === '/books' || path === '/my-books';
    const target = allowed ? path : '/books';

    void this.router.navigate([target], {
      queryParams: search ? { search } : {},
    });
  }
}
