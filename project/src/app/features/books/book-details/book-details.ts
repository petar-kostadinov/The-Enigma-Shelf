import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BooksService } from '../../../core/services/books';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';
import { Book, UpdateBook } from '../../../shared/interfaces/book';
import { FormatDateLabelPipe } from '../../../shared/pipes/format-date-label.pipe';
import { filter, finalize, map, switchMap } from 'rxjs';

const MY_BOOKS_FROM = 'my-books' as const;

function isUnreadQueryParam(v: string | null): boolean {
  if (v == null) return false;
  const s = v.trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

@Component({
  selector: 'app-book-details',
  imports: [CommonModule, RouterLink, FormatDateLabelPipe],
  templateUrl: './book-details.html',
  styleUrl: './book-details.css',
})
export class BookDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BooksService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  book = signal<Book | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  voteBusy = signal(false);
  unreadBusy = signal(false);
  deleteConfirmVisible = signal(false);
  deleteBusy = signal(false);
  likeBusyId = signal<string | null>(null);

  readonly starSlots = [1, 2, 3, 4, 5] as const;

  private fromMyBooksContext = toSignal(
    this.route.queryParamMap.pipe(map((m) => m.get('from') === MY_BOOKS_FROM)),
    { initialValue: false },
  );

  private fromUnreadFilter = toSignal(
    this.route.queryParamMap.pipe(map((m) => isUnreadQueryParam(m.get('unread')))),
    { initialValue: false },
  );

  booksListPath = computed(() => (this.fromMyBooksContext() ? '/my-books' : '/books'));

  booksListBackLabel = computed(() =>
    this.fromMyBooksContext() ? '← Back to my books' : '← Back to books',
  );

  booksListBackLabelPlain = computed(() =>
    this.fromMyBooksContext() ? 'Back to my books' : 'Back to books',
  );

  booksListReturnQueryParams(): Record<string, string> | undefined {
    if (this.fromMyBooksContext() && this.fromUnreadFilter()) {
      return { unread: '1' };
    }
    return undefined;
  }

  listFilterChipQueryParams(kind: 'genre' | 'series', value: string): Record<string, string> {
    const q: Record<string, string> = kind === 'genre' ? { genre: value } : { series: value };
    if (this.fromMyBooksContext() && this.fromUnreadFilter()) {
      q['unread'] = '1';
    }
    return q;
  }

  private myBooksFlowQueryParams(): Record<string, string> {
    const q: Record<string, string> = { from: MY_BOOKS_FROM };
    if (this.fromUnreadFilter()) q['unread'] = '1';
    return q;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => p.get('bookId')),
        filter((id): id is string => !!id),
        switchMap((id) =>
          this.bookService.getBook(id).pipe(finalize(() => this.isLoading.set(false))),
        ),
      )
      .subscribe({
        next: (b) => {
          this.deleteConfirmVisible.set(false);
          this.deleteBusy.set(false);
          if (!b?._id) {
            this.errorMessage.set('Book not found.');
            return;
          }
          this.book.set(b);
        },
        error: () => {
          this.errorMessage.set('Could not load this book.');
        },
      });
  }

  isStarOn(slot: number, rating: number | null | undefined): boolean {
    if (rating == null || Number.isNaN(rating)) return false;
    const r = Math.min(5, Math.max(0, Math.round(Number(rating))));
    return slot <= r;
  }

  isLoggedIn(): boolean {
    return !!this.authService.userSignal();
  }

  isOwner(book: Book): boolean {
    const uid = this.authService.userSignal()?._id;
    if (!uid || !book.owner) return false;
    const oid = typeof book.owner === 'object' ? book.owner._id : book.owner;
    return String(oid) === String(uid);
  }

  isLikedByMe(book: Book): boolean {
    const uid = this.authService.userSignal()?._id;
    if (!uid) return false;
    return book.likes.some((id) => String(id) === String(uid));
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
    this.bookService.toggleLikeBook(book._id).subscribe({
      next: (updated) => {
        this.book.set(updated);
        this.likeBusyId.set(null);
      },
      error: (err) => {
        this.likeBusyId.set(null);
        const message = err?.error?.message || 'Could not update your like on this book.';
        this.notification.show(message, 'error', 4500);
      },
    });
  }

  isUnreadMarked(book: Book): boolean {
    return book.unread === true;
  }

  myVoteScore(book: Book): number | null {
    const uid = this.authService.userSignal()?._id;
    if (!uid || !book.votes?.length) return null;
    const mine = book.votes.find((v) => {
      const vid = typeof v.user === 'object' ? v.user._id : v.user;
      return String(vid) === String(uid);
    });
    return mine ? mine.score : null;
  }

  goEdit(bookId: string): void {
    const extras = this.fromMyBooksContext() ? { queryParams: this.myBooksFlowQueryParams() } : {};
    void this.router.navigate(['/books', bookId, 'edit'], extras);
  }

  toggleUnread(book: Book): void {
    if (!this.isOwner(book) || this.unreadBusy()) return;
    const unread = !this.isUnreadMarked(book);

    const updateBook: UpdateBook = {
      title: book.title,
      author: book.author,
      genre: book.genre,
      imageUrl: book.imageUrl ?? '',
      series: book.series,
      summary: book.summary,
      unread,
    };

    this.unreadBusy.set(true);
    this.bookService
      .updateBook(book._id, updateBook)
      .pipe(finalize(() => this.unreadBusy.set(false)))
      .subscribe({
        next: (updated) => this.book.set(updated),
        error: (err) => {
          const message = err?.error?.message || 'Could not update.';
          this.notification.show(message, 'error', 4500);
        },
      });
  }

  openDeleteConfirm(): void {
    this.deleteConfirmVisible.set(true);
  }

  cancelDeleteConfirm(): void {
    if (this.deleteBusy()) return;
    this.deleteConfirmVisible.set(false);
  }

  confirmDelete(book: Book): void {
    if (!this.isOwner(book) || this.deleteBusy()) return;

    this.deleteBusy.set(true);
    this.bookService
      .deleteBook(book._id)
      .pipe(
        finalize(() => {
          this.deleteBusy.set(false);
          this.deleteConfirmVisible.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.notification.show('Book deleted.', 'success');
          if (this.fromMyBooksContext()) {
            const qp = this.fromUnreadFilter() ? { queryParams: { unread: '1' } } : {};
            void this.router.navigate(['/my-books'], qp);
          } else {
            void this.router.navigate(['/books']);
          }
        },
        error: (err) => {
          const message = err?.error?.message || 'Could not delete book.';
          this.notification.show(message, 'error', 4500);
        },
      });
  }

  onVote(book: Book, score: number): void {
    if (!this.isLoggedIn()) {
      this.notification.show('Log in to vote.', 'info', 3500);
      return;
    }
    if (this.isOwner(book)) {
      this.notification.show('You cannot vote on your own book.', 'info', 3500);
      return;
    }
    if (this.voteBusy()) return;

    this.voteBusy.set(true);
    this.bookService
      .voteBook(book._id, score)
      .pipe(finalize(() => this.voteBusy.set(false)))
      .subscribe({
        next: (updated) => {
          this.book.set(updated);
          this.notification.show('Your vote was saved.', 'success', 2500);
        },
        error: (err) => {
          const message = err?.error?.message || 'Could not save vote.';
          this.notification.show(message, 'error', 4500);
        },
      });
  }
}
