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
      [
        Validators.required,
        Validators.maxLength(2048),
        Validators.pattern(/^https?:\/\/.+/i),
      ],
    ],
  });

  isLoading = signal(false);
  loadError = signal<string | null>(null);
  private bookId = '';

  ngOnInit(): void {
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
          this.router.navigate(['/books', this.bookId]);
        },
        error: (err) => {
          const message = err?.error?.message || 'Could not update book.';
          this.notification.show(message, 'error', 4500);
        },
      });
  }

  cancel(): void {
    if (this.bookId) {
      this.router.navigate(['/books', this.bookId]);
    } else {
      this.router.navigate(['/books']);
    }
  }
}
