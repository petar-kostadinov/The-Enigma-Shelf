import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { Header } from './layouyt/header/header';
import { Footer } from './layouyt/footer/footer';
import { AuthService } from './core/services/auth';
import { NotificationComponent } from './core/components/notification/notification';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, NotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('project');
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.authService
      .getProfile()
      .pipe(finalize(() => this.authService.markSessionChecked()))
      .subscribe({
        next: (user) => this.authService.setSession(user),
        error: () => this.authService.clearSession(),
      });
  }
}
