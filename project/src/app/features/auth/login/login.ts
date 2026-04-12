import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginCredentials } from '../../../shared/interfaces/user';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';
import { finalize } from 'rxjs';
import { latinAlnumValidator } from '../../../shared/validators/latin-alnum.validator';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(5), latinAlnumValidator]],
  });
  isLoading = signal(false);

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    const userData: LoginCredentials = { email, password };

    this.isLoading.set(true);

    this.authService
      .login(userData)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (user) => {
          this.authService.setSession(user);
          this.notification.show(`Welcome back, ${user.username}!`, 'success');

          this.router.navigate(['/books']);
        },
        error: (err) => {
          const message = err?.error?.message || 'Login error';
          this.notification.show(message, 'error', 4500);
        },
      });
  }
}
