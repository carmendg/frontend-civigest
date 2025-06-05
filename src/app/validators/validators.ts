import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validar email
export function emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (control.value && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(control.value)) {
            return { invalidEmail: true };
        }
        return null;
    };
}
  
  // Validar campos vacios
export function requiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || control.value?.trim() === '') {
        return { required: true };
      }
      return null;
    };
}
  
  // Validar contraseña: mínimo 8 caracteres, al menos una letra y un número
export function passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (control.value && !regex.test(control.value)) {
        return { weakPassword: true };
      }
      return null;
    };
}
  
  // Validar télefono (9 digitos)
export function phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const regex = /^[0-9]{9}$/;
      if (control.value && !regex.test(control.value)) {
        return { invalidPhone: true };
      }
      return null;
    };
 }
  // Validar DNI (8 digitos + 1 letra)
export function dniValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const regex = /^[0-9]{8}[A-Za-z]{1}$/;
      if (control.value && !regex.test(control.value)) {
          return { invalidDNI: true };
      }
      return null;
    };
}

  // Comprobar coincidencia de contraseñas
export function passwordMatchValidator(pwdControlName: string, repeatPwdControlName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pwdControl = group.get(pwdControlName);
    const repeatPwdControl = group.get(repeatPwdControlName);

    if (!pwdControl || !repeatPwdControl) return null;

    if (pwdControl.value !== repeatPwdControl.value) {
        repeatPwdControl.setErrors({ ...(repeatPwdControl.errors || {}), passwordMismatch: true });
        return { passwordMismatch: true };
    } else {
        if (repeatPwdControl.hasError('passwordMismatch')) {
          const errors = { ...repeatPwdControl.errors } as { [key: string]: any };
          delete errors['passwordMismatch'];
          repeatPwdControl.setErrors(Object.keys(errors).length ? errors : null);
        }
      return null;
    }
  };
}
  //Comprobar coincidencia de emails
export function emailMatchValidator(emailControlName: string, repeatEmailControlName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
      const emailControl = group.get(emailControlName);
      const repeatEmailControl = group.get(repeatEmailControlName);

      if (!emailControl || !repeatEmailControl) return null;

      if (emailControl.value !== repeatEmailControl.value) {
        repeatEmailControl.setErrors({ ...(repeatEmailControl.errors || {}), emailMismatch: true });
        return { emailMismatch: true };
      } else {
        if (repeatEmailControl.hasError('emailMismatch')) {
          const errors = { ...repeatEmailControl.errors } as {[key:string]:any};
          delete errors['emailMismatch'];
          repeatEmailControl.setErrors(Object.keys(errors).length ? errors : null);
        }
        return null;
      }
  };
}
  //Comprobar fecha nacimiento
export function ageValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
      const today = new Date();
      const birthDate = new Date(control.value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const month = today.getMonth() - birthDate.getMonth();
      
      if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }

      if (age < 18) {
          return { underAge: true };
      }

      return null;
  };
}

  // Validar nombre y apellidos
export function nameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
      const regex = /^[A-Za-záéíóúÁÉÍÓÚñÑ ]+$/;
      if (control.value && !regex.test(control.value)) {
          return { invalidName: true };
      }
      return null;
  };
}

  // Validar dirección (letras, números, espacios, comas, puntos y guiones, pero no comillas)
export function addressValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
      const regex = /^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s,.-]*$/;
      if (control.value && !regex.test(control.value)) {
          return { invalidAddress: true };
      }
      return null;
  };
}

  // Validar enums
export function enumValidator(enumObj: object): ValidatorFn {
  const validValues = Object.values(enumObj);
  return (control: AbstractControl): ValidationErrors | null =>
    validValues.includes(control.value) ? null : { invalidEnumValue: true };
}

export function cifValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toUpperCase();
    const regex = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;
    return value && !regex.test(value) ? { invalidCIF: true } : null;
  };
}

export function descripcionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value.trim().length < 10) {
      return { invalidDescription: true };
    }

    if (value.trim().length > 200) {
      return { invalidDescription: true };
    }

    return null;
  };
}

export function isbnValidator(): ValidatorFn{
  return (control: AbstractControl): ValidationErrors | null => {
    let value: string = control.value;
    if(!value) return null;
    
    value = value.replace(/[\s-]/g, '');
    const isISBN10 = /^\d{10}$/.test(value);
    const isISBN13 = /^\d{13}$/.test(value);

    if(isISBN10) return isValidISBN10(value) ? null : { invalidISBN:true };
    else if( isISBN13 ) return isValidISBN13(value) ? null : { invalidISBN:true };
    else return {invalidISBN:true};
  };
}

function isValidISBN10(isbn:string): boolean{
  let sum =0
  for (let i =0; i<9; i++){
    if(isNaN(Number(isbn[i]))) return false;
    sum +=(10-i) * Number(isbn[i]);
  }
  let check = isbn[9].toUpperCase()
  sum += check === 'X' ? 10 : Number(check);
  return sum % 11 === 0;
}

function isValidISBN13(isbn:string): boolean{
  let sum =0
  for (let i =0; i<12; i++){
    let digit = Number(isbn[i]);
    if(isNaN(digit)) return false;
    sum += digit * (i%2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(isbn[12]);
}

export function noFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    let inputDate = new Date(control.value);
    let today = new Date();

    inputDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    if(inputDate > today){
      return {futureDate: true};
    }

    return null;
  };
}

export function isValidNumPag(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if(control.value == null || control.value === '') return null;
    let numpag = Number(control.value);
    if (isNaN(numpag) || numpag <= 0){
      return {invalidNumPag: true}
    }
    return null;
  };
}

export function isPositiveOrZeroNumber(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if(control.value == null || control.value === '') return null;
    let numpag = Number(control.value);
    if (isNaN(numpag) || numpag < 0){
      return {invalidNumber: true}
    }
    return null;
  };
}

  