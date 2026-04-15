import { Book } from '../interfaces/book';

export function matchesBookQuery(book: Book, rawQuery: string): boolean {
  const searchText = rawQuery.trim().toLowerCase();
  if (!searchText) return true;

  const title = (book.title ?? '').toLowerCase();
  const author = (book.author ?? '').toLowerCase();

  return title.includes(searchText) || author.includes(searchText);
}