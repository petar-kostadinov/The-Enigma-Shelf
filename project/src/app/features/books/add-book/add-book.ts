import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { BooksService } from '../../../core/services/books';
import { NotificationService } from '../../../core/services/notification';
import { CreateBook } from '../../../shared/interfaces/book';

@Component({
  selector: 'app-add-book',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './add-book.html',
  styleUrl: './add-book.css',
})
export class AddBookComponent {
  private booksService = inject(BooksService);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, author, genre, series, summary, imageUrl } = this.form.value;

    const addBook: CreateBook = {
      title,
      author,
      genre,
      series: series?.trim() ? series.trim() : undefined,
      summary: summary?.trim() ? summary.trim() : undefined,
      imageUrl: imageUrl.trim(),
    };

    this.isLoading.set(true);

    this.booksService
      .createBook(addBook)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.notification.show('Book created!', 'success');
          this.router.navigate(['/books']);
        },
        error: (err) => {
          const message = err?.error?.message || 'Create book error';
          this.notification.show(message, 'error', 4500);
        },
      });
  }
}
