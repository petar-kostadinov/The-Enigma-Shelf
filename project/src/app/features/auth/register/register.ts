import { ChangeDetectorRef, Component, inject, NgZone } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
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
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

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
  isLoading = false;

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { email, username, password } = this.registerForm.value;

    const userData: UserForAuth = { email, username, password };

    this.isLoading = true;

    this.authService
      .register(userData)
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
          console.log('Registered:', user);

          this.router.navigate(['/']);
        },
        error: (err) => {
          const message = err?.error?.message || 'Registration error';
          setTimeout(() => alert(message), 0);
          console.log(message);
        },
      });
  }
}
