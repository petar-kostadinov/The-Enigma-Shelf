import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { BooksService } from '../../core/services/books';
import { NotificationService } from '../../core/services/notification';
import { AuthService } from '../../core/services/auth';
import { Book } from '../../shared/interfaces/book';
import { filter, finalize, map, Subscription } from 'rxjs';
import { BookCardComponent } from './book-card/book-card';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [BookCardComponent, CommonModule, RouterLink],
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

  isLoading = signal(false);
  likeBusyId = signal<string | null>(null);

  private navSub?: Subscription;
  /** Предишен URL за детекция „връщане от детайл“ → презареждане на списъка (актуален communityRating). */
  private navPrevUrl = '';

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

  onLike(book: Book): void {
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
}
