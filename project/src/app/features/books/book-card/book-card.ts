import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from '../../../shared/interfaces/book';
import { FormatDateLabelPipe } from '../../../shared/pipes/format-date-label.pipe';

@Component({
  selector: 'app-book-card',
  imports: [CommonModule, RouterLink, FormatDateLabelPipe],
  templateUrl: './book-card.html',
  styleUrls: ['../books.css', './book-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'books-card' },
})
export class BookCardComponent {
  @Input({ required: true }) book!: Book;

  @Input() showLikeButton = true;

  @Input() likedByMe = false;
  @Input() likeBusy = false;

  @Input() showEditButton = false;

  @Input() fromMyBooks = false;

  @Input() myBooksQueryExtras: Record<string, string> | null = null;

  @Output() likeClick = new EventEmitter<Book>();

  readonly starSlots = [1, 2, 3, 4, 5] as const;

  isStarOn(slot: number, value: number | null | undefined): boolean {
    if (value == null || Number.isNaN(value)) return false;
    const r = Math.min(5, Math.max(0, Math.round(Number(value))));
    return slot <= r;
  }

  onLikeButtonClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.likeClick.emit(this.book);
  }

  genreListQueryParams(): Record<string, string> {
    const q: Record<string, string> = { genre: this.book.genre };
    if (this.fromMyBooks && this.myBooksQueryExtras) {
      Object.assign(q, this.myBooksQueryExtras);
    }
    return q;
  }

  seriesListQueryParams(): Record<string, string> {
    const q: Record<string, string> = { series: this.book.series ?? '' };
    if (this.fromMyBooks && this.myBooksQueryExtras) {
      Object.assign(q, this.myBooksQueryExtras);
    }
    return q;
  }

  detailQueryParams(): Record<string, string> | undefined {
    if (!this.fromMyBooks) return undefined;
    const q: Record<string, string> = { from: 'my-books' };
    if (this.myBooksQueryExtras) Object.assign(q, this.myBooksQueryExtras);
    return q;
  }
}
