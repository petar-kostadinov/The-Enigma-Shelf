import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent),
  },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },

  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.RegisterComponent),
  },

  {
    path: 'books',
    loadComponent: () => import('./features/books/books').then((m) => m.BooksComponent),
  },

  {
    path: 'books/add',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/add-book/add-book').then((m) => m.AddBookComponent),
  },

  {
    path: 'books/:bookId/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/books/edit-book/edit-book').then((m) => m.EditBookComponent),
  },

  {
    path: 'books/:bookId',
    loadComponent: () =>
      import('./features/books/book-details/book-details').then((m) => m.BookDetailsComponent),
  },

  {
    path: 'my-books',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/my-books/my-books').then((m) => m.MyBooksComponent),
  },

  {
    path: 'about',
    loadComponent: () =>
      import('./features/about/about').then((m) => m.AboutComponent),
  },

  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/account/account').then((m) => m.AccountComponent),
  },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
