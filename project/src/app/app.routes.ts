import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home').then((m) => m.HomeComponent),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then(
        (m) => m.RegisterComponent,
      ),
  },

  {
  path: 'books',
  loadComponent: () =>
    import('./features/books/books').then((m) => m.BooksComponent),
},

  {
    path: 'books/add',
    loadComponent: () =>
      import('./features/books/add-book/add-book').then((m) => m.AddBookComponent),
  },

  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
