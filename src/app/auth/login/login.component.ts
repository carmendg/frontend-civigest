import { Component } from '@angular/core';
import { FormsModule, FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { emailValidator, requiredValidator } from '../../validators/validators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone:true
})
export class LoginComponent {
  showPassword = false;
  loginForm: FormGroup;
  formSent = false;
  clearedErrors: Set<string> = new Set();


  constructor(private formbuilder: FormBuilder, private authService: AuthService, private router:Router) {
    // Creamos el formulario con los validadores
    this.loginForm = this.formbuilder.group({
      email: [
        '', [Validators.required, emailValidator(), requiredValidator()]  // Validar email
      ],
      pwd: [
        '', [Validators.required, requiredValidator()]  // Validar pwd
      ]
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('pwd');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onFocus(fieldName: string): void {
    // Eliminamos los errores cuando se vuelve a hacer click sobre esos campos
    this.clearedErrors.add(fieldName);
  }

  onSent() {
    this.formSent = true;
    this.clearedErrors.clear();

    if(this.loginForm.valid){
      console.log("válido");
      console.log('Datos del formulario:', this.loginForm.value);
      // Llamada al servicio para hacer petición al backend
      const loginData = this.loginForm.value;
      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('Login exitoso', response);
          // Guardar información localstorage
          this.authService.saveTokens({
            token: response.jwtToken,
            refreshToken: response.refreshToken
          });
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Error al iniciar sesión', error);
        }
      });
    }
    else{
      console.log("no valido");
      this.loginForm.markAllAsTouched();
    }
  }

}
