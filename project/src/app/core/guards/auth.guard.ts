import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.userSignal()) {
    return true;
  }

  if (!auth.sessionChecked()) {
    return toObservable(auth.sessionChecked).pipe(
      filter((checked) => checked),
      take(1),
      map(() =>
        auth.userSignal()
          ? true
          : router.createUrlTree(['/login'], {
              queryParams: { returnUrl: state.url },
            }),
      ),
    );
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
