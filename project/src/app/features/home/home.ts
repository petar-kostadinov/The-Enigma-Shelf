import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, map } from 'rxjs';

import { Book } from '../../shared/interfaces/book';
import { BooksService } from '../../core/services/books';
import { toSignal } from '@angular/core/rxjs-interop';
import { matchesBookQuery } from '../../shared/utils/book-search';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private bookService = inject(BooksService);
  private route = inject(ActivatedRoute);

  filterSearch = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('search'))), {
    initialValue: null,
  });

  searchedBooks = computed(() => {
    const searchText = this.filterSearch() ?? '';
    const list = this.allBooks();
    if (!searchText.trim()) return list;
    return list.filter((b) => matchesBookQuery(b, searchText));
  });

  hasSearch = computed(() => (this.filterSearch() ?? '').trim().length > 0);
  hasSearchMatches = computed(() => this.searchedBooks().length > 0);

  readonly starSlots = [1, 2, 3, 4, 5] as const;

  allBooks = signal<Book[]>([]);
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  topRatedBooks = computed(() => {
    const books = this.searchedBooks();
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
    const books = this.searchedBooks();
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
