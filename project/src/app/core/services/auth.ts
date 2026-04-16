import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginCredentials, UpdateProfile, User, UserForAuth } from '../../shared/interfaces/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  private user = signal<User | null>(null);
  readonly userSignal = this.user.asReadonly();

  private sessionCheckedInternal = signal(false);
  readonly sessionChecked = this.sessionCheckedInternal.asReadonly();

  markSessionChecked(): void {
    this.sessionCheckedInternal.set(true);
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }

  register(data: UserForAuth): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, data, { withCredentials: true });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/profile`, { withCredentials: true });
  }

  updateProfile(data: UpdateProfile): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/profile`, data, { withCredentials: true });
  }

  setSession(user: User): void {
    this.user.set(user);
  }

  clearSession(): void {
    this.user.set(null);
  }
}
