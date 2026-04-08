import { ChangeDetectorRef, Component, inject, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginCredentials } from '../../../shared/interfaces/user';
import { AuthService } from '../../../core/services/auth';
import { finalize } from 'rxjs';

const latinLettersAndDigits = /^[a-zA-Z0-9]+$/;

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);



  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(5), Validators.pattern(latinLettersAndDigits)],
    ],
  });
  isLoading = false;

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    const userData: LoginCredentials = { email, password };

    this.isLoading = true;

    this.authService
      .login(userData)
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          });
        }),
      )
      .subscribe({
        next: (user) => {
          this.authService.setSession(user);
          console.log('Login:', user);

          this.router.navigate(['/']);
        },
        error: (err) => {
          const message = err?.error?.message || 'Login error';
          setTimeout(() => alert(message), 0);
          console.log(message);
        },
      });
  }
}
