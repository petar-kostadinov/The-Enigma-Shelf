import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserForAuth } from '../../shared/interfaces/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  private user = signal<User | null>(null);
  readonly userSignal = this.user.asReadonly();

  register(data: UserForAuth): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, data, { withCredentials: true });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/profile`, { withCredentials: true });
  }

  setSession(user: User): void {
    this.user.set(user);
  }

  clearSession(): void {
    this.user.set(null);
  }
}
