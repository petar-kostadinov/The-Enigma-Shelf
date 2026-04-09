import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { UserForAuth } from '../../../shared/interfaces/user';
import { passwordsMatchValidator } from '../../../shared/validators/passMatch.validator';
import { finalize } from 'rxjs';

const latinLettersAndDigits = /^[a-zA-Z0-9]+$/;

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  
  registerForm: FormGroup = this.fb.group(
    {
      username: [
        '',
        [Validators.required, Validators.minLength(5), Validators.pattern(latinLettersAndDigits)],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(5), Validators.pattern(latinLettersAndDigits)],
      ],
      repeatPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );
  isLoading = signal(false);

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { email, username, password } = this.registerForm.value;

    const userData: UserForAuth = { email, username, password };

    this.isLoading.set(true);

    this.authService
      .register(userData)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (user) => {
          this.authService.setSession(user);
          this.toast.show('Registration successful!', 'success');

          this.router.navigate(['/']);
        },
        error: (err) => {
          const message = err?.error?.message || 'Registration error';
          this.toast.show(message, 'error', 4500);
        },
      });
  }
}
