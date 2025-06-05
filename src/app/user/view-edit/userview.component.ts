import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserStoreService } from '../../services/user-store.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { Role, Status, User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { enumValidator } from '../../validators/validators';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-userview',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './userview.component.html',
  styleUrl: './userview.component.css'
})
export class UserviewComponent implements OnInit{
  userForm: FormGroup;
  userData!: User;
  formSent = false;
  clearedErrors: Set<string> = new Set();
  username: string ='';
  usersurname: string ='';
  userId : string='';
  editMode = false;

  constructor( private formbuilder: FormBuilder, private userStore: UserStoreService, private userService: UserService, 
                private router: Router, private authService: AuthService, private snackBar: MatSnackBar,
                private dialog: MatDialog, private activatedRoute: ActivatedRoute ) {
    this.userForm = this.formbuilder.group({

      email: [{value: '', disabled:true} ],
      pwd: [{value: '', disabled:true} ],  // Validar pwd
      nombre: [{value: '', disabled:true} ],
      apellido: [{value: '', disabled:true} ],
      dni: [{value: '', disabled:true} ],
      telefono: [{value: '', disabled:true} ],
      direccion: [{value: '', disabled:true} ],
      birth: [{value: '', disabled:true} ],
      registrationDate: [''],
      rol: [''], 
      estado: [''],
    },
    );
  }

  roles = [
    { value: Role.admin, label: 'Administrador'},
    { value: Role.gestor, label: 'Gestor'},
    { value: Role.cliente, label: 'Cliente'}
  ]
  statuses = [
    { value: Status.active, label: 'Activo'},
    { value: Status.inactive, label: 'Inactivo'},
    { value: Status.punished, label: 'Penalizado'}
  ]


  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.userId = params['id'];
      this.editMode = this.activatedRoute.snapshot.queryParamMap.get('edit') === 'true';
      if(this.editMode){
        this.habilitarEdicion();
      }
      this.userService.getUser(this.userId).subscribe(user => {
        if (user) {
          console.log(user);
          this.userData = user;
          this.fillValuesForm(user);
          this.username=user.name;
          this.usersurname=user.surname;

        }
      });
    });
  }

  fillValuesForm(user: User): void {
    // Rellenar campos editables
    this.userForm.patchValue({
      nombre: user.name,
      apellido: user.surname,
      dni: user.dni,
      birth: new Date(user.birthdayDate).toISOString().split('T')[0],
      email: user.email,
      telefono: user.phoneNumber,
      direccion: user.address,
      registrationDate: user.registrationDate,
      rol: user.role,
      estado: user.status
    });
  }

  onFocus(fieldName: string): void {
    // Eliminamos los errores cuando se vuelve a hacer click sobre esos campos
    this.clearedErrors.add(fieldName);
   
  }

  deleteAccount(): void{
    const userId= this.authService.getUserIdFromToken();
        if(userId && userId === this.userId){
          this.snackBar.open('No te puedes eliminar a ti mismo desde aquí.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
          this.router.navigate(['/profile']);
        }
        else{
          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '350px',
            data: {
              title: '¿Estás seguro?',
              message: 'Vas a eliminar a este usuario del sistema. Esta acción no se puede deshacer.'
            }
          });
    
          dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
              this.userService.deleteUser(this.userId).subscribe({
                next:() =>{
                  this.snackBar.open('Cuenta eliminada', 'Cerrar', {
                    duration: 5000,
                    panelClass: ['snackbar-success']
                  });
                  this.router.navigate(['/userlist']);
                },
                error: (err) => {
                  console.error('Error al borrar la cuenta:', err);
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

    if(this.userForm.valid){
      console.log("válido");
      console.log(this.userData)
      console.log('Datos del formulario:', this.userForm.value);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirma actualización',
          message: '¿Estás seguro de que quieres actualizar este usuario?.\nEsta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.updateUser();
        }
      });
    }
    else{
      console.log("no valido");
      this.userForm.markAllAsTouched();
    }

  }

  private updateUser(){
    const updatedUser = this.mapFormToUpdateUser();
    console.log("Datos update", updatedUser)
    const userId= this.authService.getUserIdFromToken();
    if(userId){
      this.userService.updateUser(userId, updatedUser).subscribe({
        next:() =>{
          console.log("done");
          this.snackBar.open('Se ha actualizado correctamente al usuario.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/userlist']);
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
    else{
      this.snackBar.open('No se ha podido identificar al usuario.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
  }

  habilitarEdicion(): void {
    this.editMode = true;

    //Aplicamos los validadores del rol
    this.userForm.get('rol')?.setValidators([
      Validators.required, enumValidator(Role) 
    ]);
    this.userForm.get('rol')?.updateValueAndValidity();

    //Aplicamos los validadores del estado
    this.userForm.get('estado')?.setValidators([
      Validators.required, enumValidator(Status) 
    ]);
    this.userForm.get('estado')?.updateValueAndValidity();
  }
  deshabilitarEdicion(): void {
    this.editMode = false;
    this.userForm.get('rol')?.clearValidators();
    this.userForm.get('rol')?.updateValueAndValidity();

    this.userForm.get('estado')?.clearValidators();
    this.userForm.get('estado')?.updateValueAndValidity();
  }
  
  private mapFormToUpdateUser() {
    const v = this.userForm.getRawValue(); 
    let updatedUser: User = { ...this.userData };
    updatedUser.password="";
    
    if (v.estado !== this.userData.status) updatedUser.status = v.estado;
    if (v.rol !== this.userData.role) updatedUser.role = v.rol;

    return updatedUser;
  }

  get email() {
    return this.userForm.get('email');
  }

  get rol() {
    return this.userForm.get('rol');
  }

  get estado() {
    return this.userForm.get('estado');
  }

  get birth() {
    return this.userForm.get('birth');
  }

  get telefono() {
    return this.userForm.get('telefono');
  }

  get nombre() {
    return this.userForm.get('nombre');
  }

  get apellido() {
    return this.userForm.get('apellido');
  }

  get dni() {
    return this.userForm.get('dni');
  }

  get direccion() {
    return this.userForm.get('direccion');
  }



}
