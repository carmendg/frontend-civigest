import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LibraryDetails } from '../../models/library.model';
import { LibraryService } from '../../services/library.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/user.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import * as CustomValidators  from '../../validators/validators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-libraryview',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './libraryview.component.html',
  styleUrl: './libraryview.component.css'
})
export class LibraryviewComponent implements OnInit {

  libraryForm: FormGroup;
  libraryData!: LibraryDetails;
  formSent = false;
  clearedErrors: Set<string> = new Set();
  name: string ='';
  libraryId : string='';
  editMode = false;
  canEditOrDelete = false;
  usernameCreatedBy: string = '';
  isClient = true;

  constructor( private formbuilder: FormBuilder, private libraryService: LibraryService, private userService: UserService, 
                private router: Router, private authService: AuthService, private snackBar: MatSnackBar,
                private dialog: MatDialog, private activatedRoute: ActivatedRoute ) {

    this.libraryForm = this.formbuilder.group({

      email:  [{value: '', disabled:true} ],
      nombre:  [{value: '', disabled:true} ],
      descripcion:  [''],
      telefono:  [''],
      direccion:  ['' ],
      foto: [''],
      fotoMimeType: [''],
      cif: [{value: '', disabled:true} ],
      numplantas:['']
    },);
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.libraryId = params['id'];      
      this.libraryService.getLibrary(this.libraryId).subscribe(library => {
        if (library) {
          console.log(library);
          this.libraryData = library;
          this.fillValuesForm(library);
          this.name=library.name;
          this.userService.getUser(library.userCreatedId).subscribe({
            next:(u) =>{
              library.usernameCreatedBy = u.name + " " + u.surname;
              this.usernameCreatedBy = library.usernameCreatedBy;
              this.canEditOrDelete = this.checkIfCanEditOrDelete();
              this.isClient = this.checkIfClientUser();
              if(!this.canEditOrDelete) this.editMode=false;
              if(this.editMode) this.habilitarEdicion();
            },
            error: (err) => {
              library.usernameCreatedBy="Anónimo"
              this.canEditOrDelete = this.checkIfCanEditOrDelete();
              if(!this.canEditOrDelete) this.editMode=false;
              if(this.editMode) this.habilitarEdicion();
            }
          });
        }
      });
      
    });
    
  }

  fillValuesForm(library: LibraryDetails): void {
    this.libraryForm.patchValue({
      nombre: library.name,
      descripcion: library.description,
      email: library.email,
      telefono: library.phoneNumber,
      direccion: library.address,
      foto: library.photo,
      fotoMimeType: library.photoMimeType,
      cif: library.cif,
      numplantas: library.floorNumbers,
    });
  }

  onFocus(fieldName: string): void {
    this.clearedErrors.add(fieldName);
   
  }

  deleteLibrary(): void{
    if(!this.checkIfCanEditOrDelete()){
      this.snackBar.open('No tienes permisos para borrar a esta biblioteca', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else{
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: '¿Estás seguro?',
          message: 'Vas a eliminar a esta biblioteca del sistema. Esta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.libraryService.deleteLibrary(this.libraryData.id.toString()).subscribe({
            next:() =>{
              this.snackBar.open('Biblioteca eliminada', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.router.navigate(['/librarylist']);
            },
            error: (err) => {
              console.error('Error al borrar la biblioteca:', err);
              this.snackBar.open('Error al borrar la biblioteca', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          })
        }
      });
    }
  }

  checkIfClientUser(): boolean{
    const userrole= this.authService.getRoleFromToken();
    if(userrole && (userrole === Role.admin || userrole === Role.gestor)) return false;
    return true;
  }



  onSent():void{
    this.formSent = true;
    this.clearedErrors.clear();

    if(this.libraryForm.valid){
      console.log("válido");
      console.log(this.libraryData)
      console.log('Datos del formulario:', this.libraryForm.value);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirma actualización',
          message: '¿Estás seguro de que quieres actualizar esta biblioteca?.\nEsta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.updateLibrary();
        }
      });
    }
    else{
      console.log("no valido");
      this.libraryForm.markAllAsTouched();
    }

  }

  private updateLibrary(){
    const updatedLibrary = this.mapFormToUpdateLibrary();
    console.log("Datos update", updatedLibrary)
    this.libraryService.updateLibrary(this.libraryId, updatedLibrary).subscribe({
      next:() =>{
        console.log("done");
        this.snackBar.open('Se ha actualizado correctamente a la biblioteca.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/librarylist']);
      },
      error: (err) => {
        console.error('Error al actualizar la biblioteca:', err);
        this.snackBar.open('Error al actualizar la biblioteca.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    })
  }

  checkIfCanEditOrDelete(): boolean{
      const userrole= this.authService.getRoleFromToken();
      const userId = this.authService.getUserIdFromToken();
      if(userrole && userrole === Role.admin) return true;
      else if(userId && userId === this.libraryData.userCreatedId) return true;
      else if(userrole && userId && this.libraryData && this.libraryData.usernameCreatedBy && this.libraryData.usernameCreatedBy === "Anónimo") return true;
      else return false;
    }

  habilitarEdicion(): void {
    if(this.checkIfCanEditOrDelete()){
      this.editMode = true;

      //Aplicamos los validadores de la descripción
      this.descripcion?.setValidators([
        Validators.required, CustomValidators.descripcionValidator(), CustomValidators.requiredValidator() 
      ]);
      this.descripcion?.updateValueAndValidity();

      //Aplicamos los validadores del telefono
      this.telefono?.setValidators([
        Validators.required, CustomValidators.phoneValidator(), CustomValidators.requiredValidator()
      ]);
      this.telefono?.updateValueAndValidity();

      //Aplicamos los validadores de la dirección
      this.direccion?.setValidators([
        Validators.required, CustomValidators.addressValidator(), CustomValidators.requiredValidator() 
      ]);
      this.direccion?.updateValueAndValidity();

      //Aplicamos los validadores de la foto
      this.foto?.setValidators([
        Validators.required, CustomValidators.requiredValidator() 
      ]);
      this.foto?.updateValueAndValidity();

      //Aplicamos los validadores del número de planta
      this.numplantas?.setValidators([
        Validators.required, CustomValidators.isPositiveOrZeroNumber()
      ]);
      this.numplantas?.updateValueAndValidity()
    }
  }

  deshabilitarEdicion(): void {
    this.editMode = false;
    this.descripcion?.clearValidators();
    this.descripcion?.updateValueAndValidity();

    this.telefono?.clearValidators();
    this.telefono?.updateValueAndValidity();

    this.direccion?.clearValidators();
    this.direccion?.updateValueAndValidity();

    this.foto?.clearValidators();
    this.foto?.updateValueAndValidity();

    this.numplantas?.clearValidators();
    this.numplantas?.updateValueAndValidity();
  }
  
  private mapFormToUpdateLibrary() {
    const v = this.libraryForm.getRawValue(); 
    let updatedLibrary: LibraryDetails = { ...this.libraryData };
    updatedLibrary.usernameCreatedBy = undefined;
        
    if (v.contacto !== this.libraryData.description) updatedLibrary.description = v.descripcion;
    if (v.telefono !== this.libraryData.phoneNumber) updatedLibrary.phoneNumber = v.telefono;
    if (v.direccion !== this.libraryData.address) updatedLibrary.address = v.direccion;
    if (v.numplantas !== this.libraryData.floorNumbers) updatedLibrary.floorNumbers = v.numplantas;
    if (v.foto !== this.libraryData.photo){
      updatedLibrary.photo = v.foto;
      updatedLibrary.photoMimeType = v.fotoMimeType
    }


    return updatedLibrary;
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

  goBack(){
    console.log("volviendo");
    this.router.navigate(['/librarylist']);

  }

  viewCopyBook(){
    console.log("Hacia los ejemplares")
    this.router.navigate(['/copybooklist'], { queryParams: { libraryId: this.libraryId } })
  }

  addCopyBook(){
    console.log("Hacia nuevo ejemplar")
    this.router.navigate(['/copybooknew'], { queryParams: { libraryId: this.libraryId } })
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

  get foto(){
    return this.libraryForm.get('foto');
  }

  get numplantas(){
    return this.libraryForm.get('numplantas');
  }

  get direccion() {
    return this.libraryForm.get('direccion');
  }

}
