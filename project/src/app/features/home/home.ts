import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Book } from '../../shared/interfaces/book';
import { BooksService } from '../../core/services/books';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private bookService = inject(BooksService);

  readonly starSlots = [1, 2, 3, 4, 5] as const;

  allBooks = signal<Book[]>([]);
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  topRatedBooks = computed(() => {
    const books = this.allBooks();
    const withRating = books.filter(
      (b) => b.communityRating != null && !Number.isNaN(Number(b.communityRating)),
    );
    withRating.sort((a, b) => {
      const diff = Number(b.communityRating) - Number(a.communityRating);
      if (diff != 0) return diff;
      const ta = new Date(a.createdAt ?? 0).getTime();
      const tb = new Date(b.createdAt ?? 0).getTime();
      return tb - ta;
    });
    return withRating.slice(0, 5);
  });

  recentBooks = computed(() => {
    const books = this.allBooks();
    const topIds = new Set(this.topRatedBooks().map((b) => b._id));
    const pool = books.filter((b) => !topIds.has(b._id));
    const sorted = [...pool].sort((a, b) => {
      const ta = new Date(a.createdAt ?? 0).getTime();
      const tb = new Date(b.createdAt ?? 0).getTime();
      return tb - ta;
    });
    return sorted.slice(0, 5);
  });

  ngOnInit(): void {
    this.bookService
      .getBooks()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (books) => {
          this.loadError.set(null);
          this.allBooks.set(books);
        },
        error: () => {
          this.loadError.set('Could not load books.');
          this.allBooks.set([]);
        },
      });
  }

  isStarOn(slot: number, value: number | null | undefined): boolean {
    if (value == null || Number.isNaN(Number(value))) return false;
    const r = Math.min(5, Math.max(0, Math.round(Number(value))));
    return slot <= r;
  }
}
