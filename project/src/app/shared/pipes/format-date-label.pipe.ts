import { Pipe, PipeTransform } from '@angular/core';

/** Formats ISO dates for display (e.g. book timestamps). */
@Pipe({
  name: 'formatDateLabel',
  standalone: true,
})
export class FormatDateLabelPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (value == null || value === '') {
      return '—';
    }
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  }
}
