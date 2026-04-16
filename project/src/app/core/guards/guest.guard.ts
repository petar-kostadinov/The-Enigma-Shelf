import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth";

export const guestGuard: CanActivateFn = (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.userSignal()) {
        return true;
    }

    return router.createUrlTree(['/home'], {
        queryParams: { returnUrl: state.url},
    });
};