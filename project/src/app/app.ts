import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./layouyt/header/header";
import { Footer } from "./layouyt/footer/footer";
import { AuthService } from './core/services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('project');
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Restore session from HttpOnly cookie (if present)
    this.authService.getProfile().subscribe({
      next: (user) => this.authService.setSession(user),
      error: () => this.authService.clearSession(),
    });
  }
}
