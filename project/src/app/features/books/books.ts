import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BooksService } from '../../core/services/books';
import { NotificationService } from '../../core/services/notification';
import { Book } from '../../shared/interfaces/book';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-books',
  imports: [CommonModule],
  templateUrl: './books.html',
  styleUrl: './books.css',
})
export class BooksComponent {
  private booksService = inject(BooksService);
  private notification = inject(NotificationService);

  books = signal<Book[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    this.isLoading.set(true);

    this.booksService
      .getBooks()
      .pipe(finalize(() => (this.isLoading.set(false))))
      .subscribe({
        next: (books) => {
          console.log('books response:', books);
          this.books.set(books);
        },
        error: (err) => {
          console.log('books error:', err);
          this.notification.show('Cannot load books.', 'error', 4500);
        },
      });
  }
}
