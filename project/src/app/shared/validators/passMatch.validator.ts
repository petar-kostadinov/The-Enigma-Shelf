import { AbstractControl, ValidationErrors } from "@angular/forms";

export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const repeatPassword = control.get('repeatPassword');

    if (password?.value !== repeatPassword?.value) {
        return { PasswordsMissmatch: true }
    }

    return null;
}