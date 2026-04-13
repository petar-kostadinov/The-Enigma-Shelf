import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, finalize, map, Subscription } from 'rxjs';
import { BookCardComponent } from '../../books/book-card/book-card';
import { AuthService } from '../../../core/services/auth';
import { BooksService } from '../../../core/services/books';
import { Book } from '../../../shared/interfaces/book';

function isUnreadQueryParam(v: string | null): boolean {
  if (v == null) return false;
  const s = v.trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

@Component({
  selector: 'app-my-books',
  imports: [CommonModule, RouterLink, BookCardComponent],
  templateUrl: './my-books.html',
  styleUrls: ['../../books/books.css'],
})
export class MyBooksComponent implements OnInit, OnDestroy {
  private booksApi = inject(BooksService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  filterGenre = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('genre'))),
    { initialValue: null },
  );
  filterSeries = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('series'))),
    { initialValue: null },
  );
  filterUnread = toSignal(
    this.route.queryParamMap.pipe(map((p) => isUnreadQueryParam(p.get('unread')))),
    { initialValue: false },
  );

  allBooks = signal<Book[]>([]);
  loading = signal(true);

  myBooks = computed(() => {
    const userId = this.auth.userSignal()?._id;
    if (!userId) return [];
    return this.allBooks().filter((b) => {
      const ownerId =
        typeof b.owner === 'object' && b.owner ? b.owner._id : b.owner;
      return ownerId != null && String(ownerId) === String(userId);
    });
  });

  displayedMyBooks = computed(() => {
    let list = this.myBooks();
    const g = this.filterGenre();
    const s = this.filterSeries();
    if (g) {
      list = list.filter((b) => b.genre === g);
    }
    if (s) {
      list = list.filter((b) => (b.series ?? '') === s);
    }
    if (this.filterUnread()) {
      list = list.filter((b) => b.unread === true);
    }
    return list;
  });

  hasActiveFilter = computed(
    () => this.filterGenre() != null || this.filterSeries() != null,
  );

  /** За линкове от картите: запазва филтъра „непрочетени“ в URL. */
  myBooksQueryExtras = computed((): Record<string, string> | null => {
    if (this.filterUnread()) return { unread: '1' };
    return null;
  });

  /** Линк „Само непрочетени“ със запазени genre/series. */
  unreadFilterQueryParams(): Record<string, string> {
    const p: Record<string, string> = { unread: '1' };
    const g = this.filterGenre();
    const s = this.filterSeries();
    if (g) p['genre'] = g;
    if (s) p['series'] = s;
    return p;
  }

  readonly Math = Math;
  readonly pageSize = 8;
  currentPage = signal(1);

  totalPages = computed(() => {
    const n = this.displayedMyBooks().length;
    return Math.max(1, Math.ceil(n / this.pageSize));
  });

  pagedMyBooks = computed(() => {
    const list = this.displayedMyBooks();
    const page = Math.min(
      Math.max(1, this.currentPage()),
      this.totalPages(),
    );
    const start = (page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  private navSub?: Subscription;
  private navPrevUrl = '';

  constructor() {
    effect(() => {
      this.filterGenre();
      this.filterSeries();
      this.filterUnread();
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

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  ngOnInit(): void {
    const loadList = () => {
      this.booksApi
        .getBooks()
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (list) => this.allBooks.set(list),
          error: () => this.allBooks.set([]),
        });
    };

    if (this.auth.userSignal()) {
      loadList();
    } else {
      this.auth.getProfile().subscribe({
        next: (user) => {
          this.auth.setSession(user);
          loadList();
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/login']);
        },
      });
    }

    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const path = e.urlAfterRedirects.split('?')[0];
        const fromBookDetail = /^\/books\/[^/]+$/.test(this.navPrevUrl);
        this.navPrevUrl = path;
        if (path === '/my-books' && fromBookDetail) {
          loadList();
        }
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
