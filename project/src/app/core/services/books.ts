import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Book, CreateBook } from '../../shared/interfaces/book';

@Injectable({ providedIn: 'root' })
export class BooksService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/books`);
  }

  createBook(data: CreateBook): Observable<Book> {
    return this.http.post<Book>(`${this.apiUrl}/books`, data, { withCredentials: true });
  }

  /** Toggle like: adds your like or removes it if already liked. */
  toggleLikeBook(bookId: string): Observable<Book> {
    return this.http.put<Book>(
      `${this.apiUrl}/books/${bookId}/like`,
      {},
      { withCredentials: true },
    );
  }
}