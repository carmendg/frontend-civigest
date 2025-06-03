import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProviderService } from '../../services/provider.service';
import * as CustomValidators  from '../../validators/validators';
import { CreateProvider } from '../../models/provider.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-providernew',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './providernew.component.html',
  styleUrl: './providernew.component.css'
})
export class ProvidernewComponent {
  providerForm: FormGroup;
  formSent = false;
  clearedErrors: Set<string> = new Set();


  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar,
    private providerService: ProviderService, private authService: AuthService) {
    // Creamos el formulario con los validadores
    this.providerForm = this.formbuilder.group({

      email: [ '', [Validators.required, CustomValidators.emailValidator(), CustomValidators.requiredValidator()] ],// Validar email
      nombre: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.nameValidator()]  ], //Validar nombre
      contacto: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.nameValidator()] ],
      dni: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.dniValidator()] ],
      telefono: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.phoneValidator()] ],
      direccion: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.addressValidator()] ],
    });
  }

  onFocus(fieldName: string): void {
    // Eliminamos los errores cuando se vuelve a hacer click sobre esos campos
    this.clearedErrors.add(fieldName);
  }

  onSent() {
    this.formSent = true;
    this.clearedErrors.clear();

    if(this.providerForm.valid){
      console.log("válido");
      console.log('Datos del formulario:', this.providerForm.value);
      // Llamada al servicio para hacer petición al backend
      const newProvider = this.mapFormToCreateProvider();
      this.providerService.create(newProvider).subscribe({
        next: () => {
          console.log("done");
          this.snackBar.open('Proveedor creado', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/providerlist']);
        },
        error: (err) => {
          console.error('Error al actualizar el perfil:', err);
          this.snackBar.open('Error al crear el proveedor.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
    else{
      console.log("no valido");
      this.providerForm.markAllAsTouched();
    }
  }

  private mapFormToCreateProvider(): CreateProvider {
    const v = this.providerForm.value;
    return {
      name: v.nombre,
      contactPersonName: v.contacto,
      email: v.email,
      dni: v.dni,
      phoneNumber: v.telefono,
      address: v.direccion
    };
  }

  get email() {
    return this.providerForm.get('email');
  }

  get telefono() {
    return this.providerForm.get('telefono');
  }

  get nombre() {
    return this.providerForm.get('nombre');
  }

  get contacto() {
    return this.providerForm.get('contacto');
  }

  get dni() {
    return this.providerForm.get('dni');
  }

  get direccion() {
    return this.providerForm.get('direccion');
  }

}
