import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { ProviderDetails } from '../../models/provider.model';
import { Role } from '../../models/user.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { UserService } from '../../services/user.service';
import * as CustomValidators  from '../../validators/validators';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-providerview',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './providerview.component.html',
  styleUrl: './providerview.component.css'
})
export class ProviderviewComponent implements OnInit {
  providerForm: FormGroup;
  providerData!: ProviderDetails;
  formSent = false;
  clearedErrors: Set<string> = new Set();
  name: string ='';
  providerId : string='';
  editMode = false;
  canEditOrDelete = false;

  constructor( private formbuilder: FormBuilder, private userService: UserService, private providerService: ProviderService, 
                private router: Router, private authService: AuthService, private snackBar: MatSnackBar,
                private dialog: MatDialog, private activatedRoute: ActivatedRoute ) {
    this.providerForm = this.formbuilder.group({

      email:  [{value: '', disabled:true} ],
      nombre:  [{value: '', disabled:true} ],
      contacto:  [''],
      dni:  [{value: '', disabled:true} ],
      telefono:  [''],
      direccion:  ['' ]

    },);
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.providerId = params['id'];
      this.editMode = this.activatedRoute.snapshot.queryParamMap.get('edit') === 'true';
      
      this.providerService.getProvider(this.providerId).subscribe(provider => {
        if (provider) {
          console.log(provider);
          this.providerData = provider;
          this.fillValuesForm(provider);
          this.name=provider.name;
          this.userService.getUser(provider.userCreatedId).subscribe({
            next:(u) =>{
              provider.usernameCreatedBy = u.name + " " + u.surname;
              this.canEditOrDelete = this.checkIfCanEditOrDelete();
              if(!this.canEditOrDelete) this.editMode=false;
              if(this.editMode) this.habilitarEdicion();
            },
            error: (err) => {
              provider.usernameCreatedBy="Anónimo"
              this.canEditOrDelete = this.checkIfCanEditOrDelete();
              if(!this.canEditOrDelete) this.editMode=false;
              if(this.editMode) this.habilitarEdicion();
            }
          });
        }
      });
      
    });
    
  }

  fillValuesForm(provider: ProviderDetails): void {
    // Rellenar campos editables
    this.providerForm.patchValue({
      nombre: provider.name,
      dni: provider.dni,
      email: provider.email,
      telefono: provider.phoneNumber,
      direccion: provider.address,
      contacto: provider.contactPersonName,
    });
  }

  onFocus(fieldName: string): void {
    // Eliminamos los errores cuando se vuelve a hacer click sobre esos campos
    this.clearedErrors.add(fieldName);
   
  }

  deleteProvider(): void{
    if(!this.checkIfCanEditOrDelete()){
      this.snackBar.open('No tienes permisos para borrar a este proveedor', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else{
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: '¿Estás seguro?',
          message: 'Vas a eliminar a este proveedor del sistema. Esta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.providerService.deleteProvider(this.providerData.id.toString()).subscribe({
            next:() =>{
              this.snackBar.open('Proveedor eliminado', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.router.navigate(['/providerlist']);
            },
            error: (err) => {
              console.error('Error al borrar el proveedor:', err);
              this.snackBar.open('Error al borrar la cuenta', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          })
        }
      });
    }
  }

  onSent():void{
    this.formSent = true;
    this.clearedErrors.clear();

    if(this.providerForm.valid){
      console.log("válido");
      console.log(this.providerData)
      console.log('Datos del formulario:', this.providerForm.value);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirma actualización',
          message: '¿Estás seguro de que quieres actualizar este proveedor?.\nEsta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.updateProvider();
        }
      });
    }
    else{
      console.log("no valido");
      this.providerForm.markAllAsTouched();
    }

  }

  private updateProvider(){
    const updatedProvider = this.mapFormToUpdateProvider();
    console.log("Datos update", updatedProvider)
    this.providerService.updateProvider(this.providerId, updatedProvider).subscribe({
      next:() =>{
        console.log("done");
        this.snackBar.open('Se ha actualizado correctamente al usuario.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/providerlist']);
      },
      error: (err) => {
        console.error('Error al actualizar el usuario:', err);
        this.snackBar.open('Error al actualizar el usuario.', 'Cerrar', {
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
      else if(userId && userId === this.providerData.userCreatedId) return true;
      else if(this.providerData && this.providerData.usernameCreatedBy && this.providerData.usernameCreatedBy === "Anónimo") return true;
      else return false;
    }

  habilitarEdicion(): void {
    if(this.checkIfCanEditOrDelete()){
      this.editMode = true;

      //Aplicamos los validadores del contacto
      this.providerForm.get('contacto')?.setValidators([
        Validators.required, CustomValidators.nameValidator(), CustomValidators.requiredValidator() 
      ]);
      this.providerForm.get('contacto')?.updateValueAndValidity();

      //Aplicamos los validadores del telefono
      this.providerForm.get('telefono')?.setValidators([
        Validators.required, CustomValidators.phoneValidator(), CustomValidators.requiredValidator()
      ]);
      this.providerForm.get('telefono')?.updateValueAndValidity();

      //Aplicamos los validadores de la dirección
      this.providerForm.get('direccion')?.setValidators([
        Validators.required, CustomValidators.addressValidator(), CustomValidators.requiredValidator() 
      ]);
      this.providerForm.get('direccion')?.updateValueAndValidity();
    }
  }

  deshabilitarEdicion(): void {
    this.editMode = false;
    this.providerForm.get('contacto')?.clearValidators();
    this.providerForm.get('contacto')?.updateValueAndValidity();

    this.providerForm.get('telefono')?.clearValidators();
    this.providerForm.get('telefono')?.updateValueAndValidity();

    this.providerForm.get('direccion')?.clearValidators();
    this.providerForm.get('direccion')?.updateValueAndValidity();
  }
  
  private mapFormToUpdateProvider() {
    const v = this.providerForm.getRawValue(); 
    let updatedProvider: ProviderDetails = { ...this.providerData };
    updatedProvider.usernameCreatedBy = undefined;
        
    if (v.contacto !== this.providerData.contactPersonName) updatedProvider.contactPersonName = v.contacto;
    if (v.telefono !== this.providerData.phoneNumber) updatedProvider.phoneNumber = v.telefono;
    if (v.direccion !== this.providerData.address) updatedProvider.address = v.direccion;

    return updatedProvider;
  }

  goBack(){
    console.log("volviendo");
    this.router.navigate(['/providerlist']);

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
