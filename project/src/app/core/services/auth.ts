import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { User, UserForAuth } from '../../shared/interfaces/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  private user = signal<User | null>(null);

  register(userData: UserForAuth): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData, { withCredentials: true });
  }

  setSession(user: User): void {
    this.user.set(user);
  }

  clearSession(): void {
    this.user.set(null);
  }
}
