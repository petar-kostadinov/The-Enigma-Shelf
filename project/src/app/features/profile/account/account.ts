import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { latinAlnumValidator } from '../../../shared/validators/latin-alnum.validator';
import { finalize } from 'rxjs';
import { UpdateProfile } from '../../../shared/interfaces/user';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule],
  templateUrl: './account.html',
  styleUrls: ['../../auth/login/login.css', './account.css'],
})
export class AccountComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  isLoading = signal(true);
  isSaving = signal(false);

  accountForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(5), latinAlnumValidator]],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.isLoading.set(true);
    this.auth
      .getProfile()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (user) => {
          this.accountForm.patchValue({
            username: user.username,
            email: user.email,
          });
        },
        error: () => {
          void this.router.navigate(['/login']);
        },
      });
  }

  onSave(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const { username, email } = this.accountForm.value;
    const updProfile: UpdateProfile = { username, email };

    this.isSaving.set(true);
    this.auth
      .updateProfile(updProfile)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (user) => {
          this.auth.setSession(user);
          this.notification.show('Profile updated.', 'success');
        },
        error: (err) => {
          const msg = err?.error?.message || 'Could not update profile.';
          this.notification.show(msg, 'error', 4500);
        },
      });
  }
}
