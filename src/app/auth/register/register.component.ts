import { Component } from '@angular/core';
import { FormsModule, FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreateUser } from '../../models/user.model';
import * as CustomValidators  from '../../validators/validators';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  formSent = false;
  clearedErrors: Set<string> = new Set();


  constructor(private formbuilder: FormBuilder, private router: Router, 
    private userService: UserService, private authService: AuthService) {
    // Creamos el formulario con los validadores
    this.registerForm = this.formbuilder.group({

      email: [ '', [Validators.required, CustomValidators.emailValidator(), CustomValidators.requiredValidator()] ],// Validar email
      pwd: [ '', [Validators.required, CustomValidators.requiredValidator(), CustomValidators.passwordValidator()] ],  // Validar pwd
      nombre: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.nameValidator()]  ], //Validar nombre
      apellido: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.nameValidator()] ],
      dni: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.dniValidator()] ],
      telefono: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.phoneValidator()] ],
      direccion: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.addressValidator()] ],
      birth: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.ageValidator()] ],
      repiteEmail: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.emailValidator()] ],
      repitePwd: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.passwordValidator()] ],
    },
    {
      validators: [
        CustomValidators.emailMatchValidator('email', 'repiteEmail'),  // Comparar emails
        CustomValidators.passwordMatchValidator('pwd', 'repitePwd')  // Comparar contraseñas
      ]

    });
  }

  onFocus(fieldName: string): void {
    // Eliminamos los errores cuando se vuelve a hacer click sobre esos campos
    this.clearedErrors.add(fieldName);

    // Limpiar error de emails no coincidentes
    if (fieldName === 'email' || fieldName === 'repiteEmail') {
      const email = this.registerForm.get('email');
      const repiteEmail = this.registerForm.get('repiteEmail');
      if (repiteEmail?.hasError('emailMismatch')) {
        const errors = { ...repiteEmail.errors } as { [key: string]: any };
        delete errors['emailMismatch'];
        repiteEmail.setErrors(Object.keys(errors).length ? errors : null);
      }
    }

    // Limpiar error de contraseñas no coincidentes
    if (fieldName === 'pwd' || fieldName === 'repitePwd') {
      const pwd = this.registerForm.get('pwd');
      const repitePwd = this.registerForm.get('repitePwd');
      if (repitePwd?.hasError('passwordMismatch')) {
        const errors = { ...repitePwd.errors } as { [key: string]: any };
        delete errors['passwordMismatch'];
        repitePwd.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
  }

  onSent() {
    this.formSent = true;
    this.clearedErrors.clear();

    if(this.registerForm.valid){
      console.log("válido");
      console.log('Datos del formulario:', this.registerForm.value);
      // Llamada al servicio para hacer petición al backend
      const newUser = this.mapFormToCreateUser();
      console.log('Datos parseados:',newUser);
      this.userService.register(newUser).subscribe({
        next: () => {
          // Registro correcto, ahora hacer login automáticamente
          const credentials = {
            email: this.registerForm.value.email,
            pwd: this.registerForm.value.pwd
          };
      
          this.authService.login(credentials).subscribe({
            next: (res) => {
              this.authService.saveTokens({
                token: res.jwtToken,
                refreshToken: res.refreshToken
              });
              this.router.navigate(['/']);
            },
            error: (err) => {
              console.error('Login automático falló:', err);
            }
          });
        },
        error: (err) => {
          console.error('Registro fallido:', err);
        }
      });
    }
    else{
      console.log("no valido");
      this.registerForm.markAllAsTouched();
    }
  }

  private mapFormToCreateUser(): CreateUser {
    const v = this.registerForm.value;
    return {
      name: v.nombre,
      surname: v.apellido,
      email: v.email,
      password: v.pwd,
      dni: v.dni,
      phoneNumber: v.telefono,
      birthdayDate: new Date(v.birth).toISOString(),
      address: v.direccion
    };
  }

  get email() {
    return this.registerForm.get('email');
  }

  get repiteEmail() {
    return this.registerForm.get('repiteEmail');
  }

  get pwd() {
    return this.registerForm.get('pwd');
  }

  get repitePwd() {
    return this.registerForm.get('repitePwd');
  }

  get birth() {
    return this.registerForm.get('birth');
  }

  get telefono() {
    return this.registerForm.get('telefono');
  }

  get nombre() {
    return this.registerForm.get('nombre');
  }

  get apellido() {
    return this.registerForm.get('apellido');
  }

  get dni() {
    return this.registerForm.get('dni');
  }

  get direccion() {
    return this.registerForm.get('direccion');
  }



}
