import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filter, map, switchMap } from 'rxjs';
import { finalize } from 'rxjs';

import { BooksService } from '../../../core/services/books';
import { NotificationService } from '../../../core/services/notification';
import { CreateBook } from '../../../shared/interfaces/book';

const MY_BOOKS_FROM = 'my-books' as const;

function isUnreadQueryParam(v: string | null): boolean {
  if (v == null) return false;
  const s = v.trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

@Component({
  selector: 'app-edit-book',
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './edit-book.html',
  styleUrls: ['../add-book/add-book.css', './edit-book.css'],
})
export class EditBookComponent implements OnInit {
  private booksService = inject(BooksService);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    author: ['', [Validators.required, Validators.minLength(2)]],
    genre: ['', [Validators.required, Validators.minLength(2)]],
    series: [''],
    summary: ['', [Validators.maxLength(2000)]],
    imageUrl: [
      '',
      [Validators.required, Validators.maxLength(2048), Validators.pattern(/^https?:\/\/.+/i)],
    ],
  });

  isLoading = signal(false);
  loadError = signal<string | null>(null);
  private bookId = '';
  fromMyBooksRoute = false;

  unreadMyBooksRoute = false;

  private buildMyBooksDetailQueryParams(): Record<string, string> {
    const q: Record<string, string> = { from: MY_BOOKS_FROM };
    if (this.unreadMyBooksRoute) q['unread'] = '1';
    return q;
  }

  myBooksListOnlyQueryParams(): Record<string, string> | undefined {
    if (!this.fromMyBooksRoute) return undefined;
    return this.unreadMyBooksRoute ? { unread: '1' } : undefined;
  }

  ngOnInit(): void {
    this.fromMyBooksRoute = this.route.snapshot.queryParamMap.get('from') === MY_BOOKS_FROM;
    this.unreadMyBooksRoute =
      this.fromMyBooksRoute && isUnreadQueryParam(this.route.snapshot.queryParamMap.get('unread'));
    this.route.paramMap
      .pipe(
        map((p) => p.get('bookId')),
        filter((id): id is string => !!id),
        switchMap((id) => {
          this.bookId = id;
          return this.booksService.getBook(id);
        }),
      )
      .subscribe({
        next: (book) => {
          if (!book?._id) {
            this.loadError.set('Book not found.');
            return;
          }
          this.form.patchValue({
            title: book.title,
            author: book.author,
            genre: book.genre,
            series: book.series ?? '',
            summary: book.summary ?? '',
            imageUrl: book.imageUrl ?? '',
          });
        },
        error: () => this.loadError.set('Could not load book.'),
      });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.bookId) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, author, genre, series, summary, imageUrl } = this.form.value;

    const payload: CreateBook = {
      title,
      author,
      genre,
      series: series?.trim() ? series.trim() : undefined,
      summary: summary?.trim() ? summary.trim() : undefined,
      imageUrl: imageUrl.trim(),
    };

    this.isLoading.set(true);

    this.booksService
      .updateBook(this.bookId, payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.notification.show('Book updated.', 'success');
          const extras = this.fromMyBooksRoute
            ? { queryParams: this.buildMyBooksDetailQueryParams() }
            : {};
          void this.router.navigate(['/books', this.bookId], extras);
        },
        error: (err) => {
          const message = err?.error?.message || 'Could not update book.';
          this.notification.show(message, 'error', 4500);
        },
      });
  }

  cancel(): void {
    const extras = this.fromMyBooksRoute
      ? { queryParams: this.buildMyBooksDetailQueryParams() }
      : {};
    if (this.bookId) {
      void this.router.navigate(['/books', this.bookId], extras);
    } else {
      const dest = this.fromMyBooksRoute ? '/my-books' : '/books';
      const listQp = this.myBooksListOnlyQueryParams();
      const listExtras = listQp ? { queryParams: listQp } : {};
      void this.router.navigate([dest], listExtras);
    }
  }
}
