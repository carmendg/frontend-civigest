import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { LibraryService } from '../../services/library.service';
import { AuthService } from '../../services/auth.service';
import { CreateLibrary } from '../../models/library.model';
import * as CustomValidators from '../../validators/validators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-librarynew',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './librarynew.component.html',
  styleUrl: './librarynew.component.css'
})
export class LibrarynewComponent {

  libraryForm: FormGroup;
  formSent = false;
  clearedErrors: Set<string> = new Set();

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar,
    private libraryService: LibraryService) {
 
      this.libraryForm = this.formbuilder.group({

        email: [ '', [Validators.required, CustomValidators.emailValidator(), CustomValidators.requiredValidator()] ],
        nombre: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.nameValidator()]  ],
        descripcion: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator()] ],
        cif: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.cifValidator()] ],
        telefono: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.phoneValidator()] ],
        direccion: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.addressValidator()] ],
        foto:['',[Validators.required]],
        fotoMimeType:['']
      });
  }

  onFocus(fieldName: string): void {
    this.clearedErrors.add(fieldName);
  }

  onSent() {
    this.formSent = true;
    this.clearedErrors.clear();

    if(this.libraryForm.valid){
      console.log("válido");
      console.log('Datos del formulario:', this.libraryForm.value);
      const newLibrary = this.mapFormToCreateLibrary();
      this.libraryService.create(newLibrary).subscribe({
        next: () => {
          console.log("done");
          this.snackBar.open('Biblioteca creada', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/librarylist']);
        },
        error: (err) => {
          console.error('Error al crear la biblioteca:', err);
          this.snackBar.open('Error al crear la biblioteca.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
    else{
      console.log("no valido");
      this.libraryForm.markAllAsTouched();
    }
  }

  private mapFormToCreateLibrary(): CreateLibrary {
    const v = this.libraryForm.value;
    return {
      name: v.nombre,
      email: v.email,
      cif: v.cif,
      phoneNumber: v.telefono,
      address: v.direccion,
      description: v.descripcion,
      photo: v.foto,
      photoMimeType: v.fotoMimeType
    };
  }

  onImageSelected(event: any){
    const file = event.target.files[0]
    if (file){
      if(file.type.startsWith('image/')){
        const reader = new FileReader();
        reader.onload =() =>{
          const base64String = (reader.result as string).split(',')[1];
          const mimeType = file.type;

          this.libraryForm.patchValue({
            foto: base64String,
            fotoMimeType: mimeType
          })
        };
        reader.readAsDataURL(file);
      }
    }
  }

  get email() {
    return this.libraryForm.get('email');
  }

  get telefono() {
    return this.libraryForm.get('telefono');
  }

  get nombre() {
    return this.libraryForm.get('nombre');
  }

  get descripcion() {
    return this.libraryForm.get('descripcion');
  }

  get cif() {
    return this.libraryForm.get('cif');
  }

  get foto(){
    return this.libraryForm.get('foto');
  }


  get direccion() {
    return this.libraryForm.get('direccion');
  }


}
