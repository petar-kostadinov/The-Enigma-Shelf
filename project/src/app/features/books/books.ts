import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { BooksService } from '../../core/services/books';
import { NotificationService } from '../../core/services/notification';
import { AuthService } from '../../core/services/auth';
import { Book } from '../../shared/interfaces/book';
import { FormatDateLabelPipe } from '../../shared/pipes/format-date-label.pipe';
import { filter, finalize, map, Subscription } from 'rxjs';

@Component({
  selector: 'app-books',
  imports: [CommonModule, RouterLink, FormatDateLabelPipe],
  templateUrl: './books.html',
  styleUrl: './books.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooksComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private booksService = inject(BooksService);
  private notification = inject(NotificationService);
  private authService = inject(AuthService);

  filterGenre = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('genre'))),
    { initialValue: null },
  );
  filterSeries = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('series'))),
    { initialValue: null },
  );

  allBooks = signal<Book[]>([]);
  displayedBooks = computed(() => {
    let list = this.allBooks();
    const g = this.filterGenre();
    const s = this.filterSeries();
    if (g) {
      list = list.filter((b) => b.genre === g);
    }
    if (s) {
      list = list.filter((b) => (b.series ?? '') === s);
    }
    return list;
  });

  /** За шаблона: дали има активен филтър от URL */
  hasActiveFilter = computed(
    () => this.filterGenre() != null || this.filterSeries() != null,
  );

  /** За шаблона: диапазон „показване X–Y от Z“. */
  readonly Math = Math;

  /** Брой карти на страница (промени при нужда: 6 или 8). */
  readonly pageSize = 8;
  currentPage = signal(1);

  totalPages = computed(() => {
    const n = this.displayedBooks().length;
    return Math.max(1, Math.ceil(n / this.pageSize));
  });

  pagedBooks = computed(() => {
    const list = this.displayedBooks();
    const page = Math.min(
      Math.max(1, this.currentPage()),
      this.totalPages(),
    );
    const start = (page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  isLoading = signal(false);
  likeBusyId = signal<string | null>(null);

  private navSub?: Subscription;
  /** Предишен URL за детекция „връщане от детайл“ → презареждане на списъка (актуален communityRating). */
  private navPrevUrl = '';

  readonly starSlots = [1, 2, 3, 4, 5] as const;

  constructor() {
    effect(() => {
      this.filterGenre();
      this.filterSeries();
      untracked(() => this.currentPage.set(1));
    });
    effect(() => {
      const tp = this.totalPages();
      untracked(() => {
        if (this.currentPage() > tp) {
          this.currentPage.set(tp);
        }
      });
    });
  }

  ngOnInit(): void {
    this.loadBooks();

    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const path = e.urlAfterRedirects.split('?')[0];
        const fromBookDetail = /^\/books\/[^/]+$/.test(this.navPrevUrl);
        this.navPrevUrl = path;
        if (path === '/books' && fromBookDetail) {
          this.loadBooks();
        }
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  private loadBooks(): void {
    this.isLoading.set(true);

    this.booksService
      .getBooks()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (books) => {
          this.allBooks.set(books);
        },
        error: () => {
          this.notification.show('Cannot load books.', 'error', 4500);
        },
      });
  }

  isStarOn(slot: number, value: number | null | undefined): boolean {
    if (value == null || Number.isNaN(value)) return false;
    const r = Math.min(5, Math.max(0, Math.round(Number(value))));
    return slot <= r;
  }

  isLikedByMe(book: Book): boolean {
    const uid = this.authService.userSignal()?._id;
    if (!uid) return false;
    return book.likes.some((id) => String(id) === String(uid));
  }

  isOwner(book: Book): boolean {
    const uid = this.authService.userSignal()?._id;
    if (!uid || !book.owner) return false;
    const oid =
      typeof book.owner === 'object' ? book.owner._id : book.owner;
    return String(oid) === String(uid);
  }

  onLike(book: Book, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.userSignal()) {
      this.notification.show('Log in to like books.', 'info', 3500);
      return;
    }

    if (this.isOwner(book)) {
      this.notification.show('You cannot like your own book.', 'info', 3500);
      return;
    }

    this.likeBusyId.set(book._id);
    this.booksService.toggleLikeBook(book._id).subscribe({
      next: (updated) => {
        this.allBooks.update((list) =>
          list.map((b) => (b._id === updated._id ? { ...b, ...updated } : b)),
        );
        this.likeBusyId.set(null);
      },
      error: (err) => {
        this.likeBusyId.set(null);
        const message =
          err?.error?.message || 'Could not update your like on this book.';
        this.notification.show(message, 'error', 4500);
      },
    });
  }

  goPrevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  goNextPage(): void {
    const max = this.totalPages();
    this.currentPage.update((p) => Math.min(max, p + 1));
  }
}
