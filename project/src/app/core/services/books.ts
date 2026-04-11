import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Book, CreateBook, UpdateBook } from '../../shared/interfaces/book';

@Injectable({ providedIn: 'root' })
export class BooksService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/books`);
  }

  getBook(bookId: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/books/${bookId}`);
  }

  createBook(data: CreateBook): Observable<Book> {
    return this.http.post<Book>(`${this.apiUrl}/books`, data, { withCredentials: true });
  }

  updateBook(bookId: string, data: UpdateBook): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/books/${bookId}`, data, {
      withCredentials: true,
    });
  }

  deleteBook(bookId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/books/${bookId}`, {
      withCredentials: true,
    });
  }

  /** Reader score 1–5 (cannot vote on own book — server returns 403). */
  voteBook(bookId: string, score: number): Observable<Book> {
    return this.http.put<Book>(
      `${this.apiUrl}/books/${bookId}/vote`,
      { score },
      { withCredentials: true },
    );
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
