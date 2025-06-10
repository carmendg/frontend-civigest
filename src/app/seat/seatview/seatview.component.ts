import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeatDetails, SeatStatus } from '../../models/seat.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SeatService } from '../../services/seat.service';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { LibraryService } from '../../services/library.service';
import * as CustomValidators  from '../../validators/validators';
import { Role } from '../../models/user.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-seatview',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './seatview.component.html',
  styleUrl: './seatview.component.css'
})
export class SeatviewComponent implements OnInit{

  seatForm: FormGroup;
  seatData!: SeatDetails;
  formSent = false;
  clearedErrors: Set<string> = new Set();
  seatId: string = '';
  editMode = false;
  canEditOrDelete = false;
  usernameCreatedBy: string = '';
  isClient = true;
  statuses = Object.entries(SeatStatus).map(([key,value]) =>({value:key, label:value}));

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar,
              private userService: UserService, private dialog:MatDialog, private seatService: SeatService,
              private activatedRoute: ActivatedRoute, private authService: AuthService, private location: Location,
              private libraryService: LibraryService )
    {
      this.seatForm = this.formbuilder.group({

        planta: [ {value: '', disabled:true} ],
        sala: [ {value: '', disabled:true} ],
        biblio: [{value: '', disabled:true} ],
        asiento: [ {value: '', disabled:true} ],
        ventana:[{value: false, disabled:true}],
        enchufe:[{value: false, disabled:true}],
        wc:[{value: false, disabled:true}],        
        comentario: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator()] ],
        estado:[''],
      });

    }

  ngOnInit(): void {
    console.log(this.statuses)
    this.activatedRoute.params.subscribe(params => {
      this.seatId = params['id'];
      this.editMode = this.activatedRoute.snapshot.queryParamMap.get('edit') === 'true';
      this.seatService.getSeat(this.seatId).subscribe((seat:SeatDetails)=> {
        if (seat) {
          console.log(seat);
          this.seatData = seat;
          this.fillValuesForm(seat);

          this.libraryService.getLibrary(seat.libraryId + '').subscribe({
            next:(l) =>{
              seat.libraryName = l.name;
              this.biblio?.setValue(l.name);
            },
            error: (err) => {
              console.log("Error al obtener el libro", err)
              this.snackBar.open('Ha ocurrido un error.', 'Cerrar', {
                  duration: 3000,
                  panelClass: ['snackbar-error']
              });
              this.router.navigate(['/']);
            }
          })

          this.userService.getUser(seat.userCreatedId).subscribe({
            next:(u) =>{
              seat.usernameCreatedBy = u.name + " " + u.surname;
              this.usernameCreatedBy = seat.usernameCreatedBy;
              this.canEditOrDelete = this.checkIfCanEditOrDelete();
              this.isClient = this.checkIfClientUser();
              if(!this.canEditOrDelete) this.editMode=false;
              if(this.editMode) this.habilitarEdicion();
            },
            error: (err) => {
              seat.usernameCreatedBy="Anónimo"
              this.canEditOrDelete = this.checkIfCanEditOrDelete();
              if(!this.canEditOrDelete) this.editMode=false;
              if(this.editMode) this.habilitarEdicion();
            }
          });
        }
      });
      
    });
  }

  checkIfCanEditOrDelete(): boolean{
    if(this.checkIfReserved()) return false;
    const userrole= this.authService.getRoleFromToken();
    const userId = this.authService.getUserIdFromToken();
    if(userrole && userrole === Role.admin) return true;
    else if(userId && userId === this.seatData.userCreatedId) return true;
    else if(userrole && userId && this.seatData && this.seatData.usernameCreatedBy && this.seatData.usernameCreatedBy === "Anónimo") return true;
    else return false;
    
  }

  checkIfReserved(): boolean {
    return this.seatData.status === SeatStatus.reserved
  }

  checkIfClientUser(): boolean{
    const userrole= this.authService.getRoleFromToken();
    if(userrole && (userrole === Role.admin || userrole === Role.gestor)) return false;
    return true;
  }

  fillValuesForm(seat: SeatDetails): void{
    this.seatForm.patchValue({
      planta: seat.floorNum,
      comentario: seat.remarks,
      asiento: seat.seatNum,
      estado: seat.status,
      ventana: seat.hasWindow,
      enchufe: seat.hasSocket,
      wc: seat.isWCNear,
      sala: seat.roomNum
    });
  }
  
  habilitarEdicion(): void {
    if(this.checkIfCanEditOrDelete()){
      this.editMode = true;

      //Aplicamos los validadores del comentario
      this.comentario?.setValidators([
        Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator() 
      ]);
      this.comentario?.updateValueAndValidity();

      //Aplicamos los validadores del estado
      this.estado?.setValidators([
        Validators.required, CustomValidators.enumValidator(SeatStatus) 
      ]);
      this.estado?.updateValueAndValidity();

      this.ventana?.enable()
      this.ventana?.updateValueAndValidity();

      this.enchufe?.enable()
      this.enchufe?.updateValueAndValidity();

      this.wc?.enable()
      this.wc?.updateValueAndValidity();
    }
  }

  deshabilitarEdicion(): void {
    this.editMode = false;

    this.comentario?.clearValidators();
    this.comentario?.updateValueAndValidity();

    this.estado?.clearValidators();
    this.estado?.updateValueAndValidity();

    this.ventana?.disable()
    this.ventana?.updateValueAndValidity();

    this.enchufe?.disable()
    this.enchufe?.updateValueAndValidity();

    this.wc?.disable()
    this.wc?.updateValueAndValidity();
  }

  onFocus(fieldName: string): void {
    this.clearedErrors.add(fieldName);
  }

  deleteSeat(){
    if(this.checkIfReserved()){
      this.snackBar.open('No puedes borrar este asiento. Está reservado', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else if(!this.checkIfCanEditOrDelete()){
      this.snackBar.open('No tienes permisos para eliminar este asiento', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: '¿Estás seguro?',
          message: 'Vas a eliminar a este asiento del sistema. Esta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.seatService.deleteSeat(this.seatId.toString()).subscribe({
            next:() =>{
              this.snackBar.open('Asiento eliminado', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.location.back();
            },
            error: (err) => {
              console.error('Error al borrar el asiento:', err);
              this.snackBar.open('Error al borrar el asiento', 'Cerrar', {
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

    if(this.seatForm.valid){
      console.log("válido");
      console.log(this.seatData)
      console.log('Datos del formulario:', this.seatForm.value);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirma actualización',
          message: '¿Estás seguro de que quieres actualizar este asiento?.\nEsta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.updateSeat();
        }
      });
    }
    else{
      console.log("no valido");
      this.seatForm.markAllAsTouched();
    }
  }

  private updateSeat(){
    let updatedSeat = this.mapFormToUpdateSeat();
    console.log("Datos update", updatedSeat)
    this.seatService.updateSeat(this.seatId, updatedSeat).subscribe({
      next:() =>{
        console.log("done");
        this.snackBar.open('Se ha actualizado correctamente el asiento.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.location.back();
      },
      error: (err) => {
        console.error('Error al actualizar el asiento:', err);
        this.snackBar.open('Error al actualizar el asiento.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    })
  }

   private mapFormToUpdateSeat() {
      const v = this.seatForm.getRawValue(); 
      let updatedSeat: SeatDetails = { ...this.seatData };
      updatedSeat.usernameCreatedBy = undefined;
      updatedSeat.libraryName = undefined;
          
      if (v.ventana !== this.seatData.hasWindow) updatedSeat.hasWindow = v.ventana;
      if (v.wc !== this.seatData.isWCNear) updatedSeat.isWCNear = v.wc;
      if (v.enchufe !== this.seatData.hasSocket) updatedSeat.hasSocket = v.enchufe;
      if (v.comentario !== this.seatData.remarks) updatedSeat.remarks = v.comentario;
      if (v.estado !== this.seatData.status) updatedSeat.status = v.estado;
  
  
      return updatedSeat;
    }


  goBack(){
    console.log("volviendo");
    this.location.back();
  }

  get biblio() {
    return this.seatForm.get('biblio');
  }
  get planta() {
    return this.seatForm.get('planta');
  }
  get sala() {
    return this.seatForm.get('sala');
  }
  get ventana() {
    return this.seatForm.get('ventana');
  }
  get enchufe() {
    return this.seatForm.get('enchufe');
  }
  get wc() {
    return this.seatForm.get('wc');
  }
  get asiento(){
    return this.seatForm.get('asiento');
  }
  get estado(){
    return this.seatForm.get('estado');
  }
  get comentario(){
    return this.seatForm.get('comentario');
  }

}
