import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BooksService } from '../../../core/services/books';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';
import { Book, UpdateBook } from '../../../shared/interfaces/book';
import { FormatDateLabelPipe } from '../../../shared/pipes/format-date-label.pipe';
import { filter, finalize, map, switchMap } from 'rxjs';

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

  readonly starSlots = [1, 2, 3, 4, 5] as const;

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
    const oid =
      typeof book.owner === 'object' ? book.owner._id : book.owner;
    return String(oid) === String(uid);
  }

  /** For template: optional API field */
  isUnreadMarked(book: Book): boolean {
    return book.unread === true;
  }

  /** Current user’s reader score for this book, if any. */
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
    this.router.navigate(['/books', bookId, 'edit']);
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
          this.router.navigate(['/books']);
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
