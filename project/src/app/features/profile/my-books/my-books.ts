import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, finalize, map, Subscription } from 'rxjs';
import { BookCardComponent } from '../../books/book-card/book-card';
import { AuthService } from '../../../core/services/auth';
import { BooksService } from '../../../core/services/books';
import { Book } from '../../../shared/interfaces/book';
import { matchesBookQuery } from '../../../shared/utils/book-search';

function isUnreadQueryParam(v: string | null): boolean {
  if (v == null) return false;
  const s = v.trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

@Component({
  selector: 'app-my-books',
  imports: [BookCardComponent, CommonModule, RouterLink],
  templateUrl: './my-books.html',
  styleUrls: ['../../books/books.css'],
})
export class MyBooksComponent implements OnInit, OnDestroy {
  private booksApi = inject(BooksService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  filterGenre = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('genre'))), {
    initialValue: null,
  });
  filterSeries = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('series'))), {
    initialValue: null,
  });
  filterUnread = toSignal(
    this.route.queryParamMap.pipe(map((p) => isUnreadQueryParam(p.get('unread')))),
    { initialValue: false },
  );
  filterSearch = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('search'))), {
    initialValue: null,
  });

  allBooks = signal<Book[]>([]);
  loading = signal(true);

  myBooks = computed(() => {
    const userId = this.auth.userSignal()?._id;
    if (!userId) return [];
    return this.allBooks().filter((b) => {
      const ownerId = typeof b.owner === 'object' && b.owner ? b.owner._id : b.owner;
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
    const searchText = this.filterSearch() ?? '';
    if (searchText.trim()) {
      list = list.filter((b) => matchesBookQuery(b, searchText));
    }

    return list;
  });

  hasActiveFilter = computed(() => this.filterGenre() != null || this.filterSeries() != null);

  bookCardUrlExtras = computed((): Record<string, string> | null => {
    if (this.filterUnread()) return { unread: '1' };
    return null;
  });

  unreadFilterQueryParams(): Record<string, string> {
    const p: Record<string, string> = { unread: '1' };
    const g = this.filterGenre();
    const s = this.filterSeries();
    if (g) p['genre'] = g;
    if (s) p['series'] = s;
    return p;
  }

  private navSub?: Subscription;
  private navPrevUrl = '';

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
}
