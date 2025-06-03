import { Component, OnInit  } from '@angular/core';
import { FormsModule, FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserStoreService } from '../../services/user-store.service';
import { UserService } from '../../services/user.service';
import { Status, User } from '../../models/user.model';
import { Router } from '@angular/router';
import * as CustomValidators  from '../../validators/validators';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit{
  profileForm: FormGroup;
  userData!: User;
  formSent = false;
  clearedErrors: Set<string> = new Set();

  constructor( private formbuilder: FormBuilder, private userStore: UserStoreService, private userService: UserService, 
                private router: Router, private authService: AuthService, private snackBar: MatSnackBar,
                private dialog: MatDialog ) {
    this.profileForm = this.formbuilder.group({

      email: [{value: '', disabled:true} ],
      pwd: [ '', [ CustomValidators.passwordValidator()] ],  // Validar pwd
      nombre: [{value: '', disabled:true} ],
      apellido: [{value: '', disabled:true} ],
      dni: [{value: '', disabled:true} ],
      telefono: ['',[CustomValidators.phoneValidator()] ],
      direccion: ['',[ CustomValidators.addressValidator()] ],
      birth: [{value: '', disabled:true} ],
      repitePwd: ['',[ CustomValidators.passwordValidator()] ],
      registrationDate: [''],
      role: [''],
      status: ['']
    },
    {
      validators: [
        CustomValidators.passwordMatchValidator('pwd', 'repitePwd')  // Comparar contraseñas
      ]

    });
  }

  ngOnInit(): void {
    this.userStore.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
        this.fillValuesForm(user);
      }
    });
  }

  fillValuesForm(user: User): void {
    // Rellenar campos editables
    this.profileForm.patchValue({
      nombre: user.name,
      apellido: user.surname,
      dni: user.dni,
      birth: new Date(user.birthdayDate).toISOString().split('T')[0],
      email: user.email,
      telefono: user.phoneNumber,
      direccion: user.address,
      registrationDate: user.registrationDate,
      role: user.role,
      status: user.status
    });
  }

  onFocus(fieldName: string): void {
    // Eliminamos los errores cuando se vuelve a hacer click sobre esos campos
    this.clearedErrors.add(fieldName);

    // Limpiar error de contraseñas no coincidentes
    if (fieldName === 'pwd' || fieldName === 'repitePwd') {
      const pwd = this.profileForm.get('pwd');
      const repitePwd = this.profileForm.get('repitePwd');
      if (repitePwd?.hasError('passwordMismatch')) {
        const errors = { ...repitePwd.errors } as { [key: string]: any };
        delete errors['passwordMismatch'];
        repitePwd.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
  }

  deleteAccount(): void{
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: '¿Estás seguro?',
        message: 'Vas a eliminar completamente tu cuenta. Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const userId= this.authService.getUserIdFromToken();
        if(userId){
          this.userService.deleteUser(userId).subscribe({
            next:() =>{
              this.snackBar.open('Cuenta eliminada', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.authService.logout();
              this.router.navigate(['/']);
            },
            error: (err) => {
              console.error('Error al descativar la cuenta:', err);
              this.snackBar.open('Error al descativar la cuenta', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          })
        }
        else{
          //ERROR TOKEN
          this.snackBar.open('No se ha podido identificar al usuario.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
        }
      }
    });

  }

  onSent():void{
    this.formSent = true;
    this.clearedErrors.clear();

    if(this.profileForm.valid){
      console.log("válido");
      console.log(this.userData)
      console.log('Datos del formulario:', this.profileForm.value);
      const updatedUser = this.mapFormToUpdateUser();
      console.log("Datos update", updatedUser)
      const userId= this.authService.getUserIdFromToken();
      if(userId){
        this.userService.updateUser(userId, updatedUser).subscribe({
          next:() =>{
            console.log("done");
            this.snackBar.open('Datos actualizados correctamente.', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
            this.router.navigate(['/profile']);
          },
          error: (err) => {
            console.error('Error al actualizar el perfil:', err);
            this.snackBar.open('Error al actualizar los datos.', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-error']
            });
          }
        })
      }
      else{
        //ERROR TOKEN
        this.snackBar.open('No se ha podido identificar al usuario.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
      }
    }
    else{
      console.log("no valido");
      this.profileForm.markAllAsTouched();
    }

  }


  putInactive(): void{
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: '¿Estás seguro?',
        message: 'Vas a desactivar tu cuenta. Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const userId= this.authService.getUserIdFromToken();
        const updatedUser = this.mapFormToUpdateUser();
        if(userId){
          updatedUser.status=Status.inactive;
          this.userService.updateUser(userId, updatedUser).subscribe({
            next:() =>{
              this.snackBar.open('Cuenta desactivada', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.authService.logout();
              this.router.navigate(['/']);
            },
            error: (err) => {
              console.error('Error al descativar la cuenta:', err);
              this.snackBar.open('Error al descativar la cuenta', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          })
        }
        else{
          //ERROR TOKEN
          this.snackBar.open('No se ha podido identificar al usuario.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
        }
      }
    });

  }

  
  private mapFormToUpdateUser() {
    const v = this.profileForm.getRawValue(); 
    let updatedUser = this.userData;

    if (v.pwd) {
      updatedUser.password = v.pwd;
    } else {
      updatedUser.password = "";
    }
    if (v.telefono !== this.userData.phoneNumber) updatedUser.phoneNumber = v.telefono;
    if (v.direccion !== this.userData.address) updatedUser.address = v.direccion;

    return updatedUser;
  }

  get email() {
    return this.profileForm.get('email');
  }

  get pwd() {
    return this.profileForm.get('pwd');
  }

  get repitePwd() {
    return this.profileForm.get('repitePwd');
  }

  get birth() {
    return this.profileForm.get('birth');
  }

  get telefono() {
    return this.profileForm.get('telefono');
  }

  get nombre() {
    return this.profileForm.get('nombre');
  }

  get apellido() {
    return this.profileForm.get('apellido');
  }

  get dni() {
    return this.profileForm.get('dni');
  }

  get direccion() {
    return this.profileForm.get('direccion');
  }



}
