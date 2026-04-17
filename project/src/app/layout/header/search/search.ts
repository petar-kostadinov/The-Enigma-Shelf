import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  imports: [],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class SearchComponent {
  private router = inject(Router);

  onSearch(raw: string): void {
    const search = raw.trim();
    const path = this.router.url.split('?')[0];
    const allowed = path === '/home' || path === '/books' || path === '/my-books';
    const target = allowed ? path : '/books';

    void this.router.navigate([target], {
      queryParams: search ? { search } : {},
    });
  }
}
