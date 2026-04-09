import { AbstractControl, ValidationErrors } from '@angular/forms';

const latinLettersAndDigits = /^[a-zA-Z0-9]+$/;

export function latinAlnumValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value == null || value === '') return null;
  return latinLettersAndDigits.test(String(value)) ? null : { latinAlnum: true };
}