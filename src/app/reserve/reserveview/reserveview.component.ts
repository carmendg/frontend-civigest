import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import * as CustomValidators  from '../../validators/validators';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LibraryService } from '../../services/library.service';
import { SeatService } from '../../services/seat.service';
import { ReserveService } from '../../services/reserve.service';
import { SeatDetails, SeatSearchParams, SeatStatus } from '../../models/seat.model';
import { CreateReserve, ReserveDetails, ReserveSearchParams } from '../../models/reserve.model';
import { AuthService } from '../../services/auth.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { Role } from '../../models/user.model';

@Component({
  selector: 'app-reserveview',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reserveview.component.html',
  styleUrl: './reserveview.component.css'
})
export class ReserveviewComponent implements OnInit{

  reserveForm: FormGroup;
  formSent = false;
  loadSent = false;
  optionsSelected = false;
  clearedErrors: Set<string> = new Set();
  floorNumberList: number[] =[];
  libraryName = '';
  biblioSelected = false;
  seatList: SeatDetails[] = [];
  selectedSeatId: number | null = null;
  reserveId: string = '';
  editMode = false;
  canEditOrDelete = false;
  reserveData!: ReserveDetails;
  isClient = false;
  isOwner = false;

  seatSearchParams: SeatSearchParams ={
    npag: 0,
    nelem: 50,
    orderBy:'asc',
    orderField:'asiento'
  }

  reserveSearchParams: ReserveSearchParams={
    nelem: 1000,
    npag: 0,
  }

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar, private activatedRoute: ActivatedRoute, private dialog:MatDialog,
          private libraryService: LibraryService, private seatService: SeatService, private userService: UserService,
          private reserveService: ReserveService, private authService: AuthService, private location: Location ){
  
            this.reserveForm = this.formbuilder.group({
              planta: [ '' ],
              fechaReserva: [ ''] ,
              asiento: [ ''],
            })
    }
  
    ngOnInit(): void {
  
       this.activatedRoute.params.subscribe(params => {
          this.reserveId = params['id'];
          this.editMode = this.activatedRoute.snapshot.queryParamMap.get('edit') === 'true';
          this.reserveService.getReserve(this.reserveId).subscribe((reserve:ReserveDetails)=> {
            if (reserve) {
              console.log(reserve);
              this.reserveData = reserve;
              this.fillValuesForm(reserve);

              this.libraryService.getLibrary(reserve.libraryId + '').subscribe({
                next:(l) =>{
                  reserve.library = l.name;
                  this.libraryName = l.name;
                  this.fillFloorNumbers(l.floorNumbers)
                  this.loadSeat();
                  this.selectedSeatId = reserve.seatReservedId;
                  this.asiento?.setValue(reserve.seatNum)

                  this.canEditOrDelete = this.checkIfCanEditOrDelete();
                  this.isClient = this.checkIfClientUser();
                  this.isOwner = this.checkIfIsOwner();
                  if(!this.canEditOrDelete) this.editMode=false;
                  if(this.editMode) this.habilitarEdicion();

                  this.loadSent = true;
                  this.clearedErrors.clear();
                  this.checkAndLoadSeats()
                  
                },
                error: (err) => {
                  console.log("Error al obtener la reserva", err)
                  this.snackBar.open('Ha ocurrido un error.', 'Cerrar', {
                      duration: 3000,
                      panelClass: ['snackbar-error']
                  });
                  this.router.navigate(['/']);
                }
              })
            }
          });
        
      });
      
    }
    fillValuesForm(reserve: ReserveDetails): void{
    this.reserveForm.patchValue({
      planta: reserve.floorNum,
      asiento: reserve.seatNum,
      fechaReserva: reserve.reserveDate,
    });
  }

    checkIfCanEditOrDelete(): boolean{
      if(!this.checkFutureDate(this.reserveData.reserveDate) ) return false;
      const userrole= this.authService.getRoleFromToken();
      const userId = this.authService.getUserIdFromToken();
      if(userrole && (userrole === Role.admin || userrole === Role.gestor)) return true;
      else if(userId && userId === this.reserveData.userReservedId + '') return true;
      else return false;
      
    }

    checkFutureDate(date:string): boolean{
      let today = new Date();
      let reserveDate = new Date(date);
      today.setHours(0,0,0,0);
      reserveDate.setHours(0,0,0,0);
      
      return today < reserveDate;
    }

    checkIfClientUser(): boolean{
      const userrole= this.authService.getRoleFromToken();
      if(userrole && (userrole === Role.admin || userrole === Role.gestor)) return false;
      return true;
    }

    checkIfIsOwner(): boolean{
      const userId = this.authService.getUserIdFromToken();
      if(userId && userId === this.reserveData.userReservedId +'') return true;
      else return false;
    }

    habilitarEdicion(): void {
      if(this.checkIfCanEditOrDelete()){
        this.editMode = true;
  
        //Aplicamos los validadores de la planta
        this.planta?.setValidators([
          Validators.required, CustomValidators.isValidFloorNumber(this.floorNumberList) 
        ]);
        this.planta?.updateValueAndValidity();
  
        //Aplicamos los validadores de la fecha
        this.fechaReserva?.setValidators([
          Validators.required, CustomValidators.NoPastDateValidator() 
        ]);
        this.fechaReserva?.updateValueAndValidity();

        //Aplicamos los validadores del asiento
        this.asiento?.setValidators([
          Validators.required 
        ]);
        this.asiento?.updateValueAndValidity();
  
      }
    }
    
    deshabilitarEdicion(): void {
      this.editMode = false;
  
      this.planta?.clearValidators();
      this.planta?.updateValueAndValidity();
  
      this.fechaReserva?.clearValidators();
      this.fechaReserva?.updateValueAndValidity();
  
      this.asiento?.disable()
      this.asiento?.updateValueAndValidity();

    }
  
    fillFloorNumbers(floorNum: number): void {
      if(this.floorNumberList.length > 0){
        this.floorNumberList = [];
      }
  
      for(let i=0; i<floorNum; i++){
        this.floorNumberList.push(i+1);
      }
    }
  
    onFocus(fieldName: string): void {
      this.clearedErrors.add(fieldName);
    }
  
    loadSeat(){
      this.selectedSeatId=null;
      this.asiento?.setValue('');
      this.loadSent = true;
      this.clearedErrors.clear();
      this.checkAndLoadSeats()
    }
  
    private shouldEnableSeatSelection(): boolean{
      if(this.planta?.valid && this.fechaReserva?.valid){
        return true;
      }
      else return false;
    }
  
    private checkAndLoadSeats(): void{
      if(this.shouldEnableSeatSelection()){
        this.optionsSelected = true;
        this.getSeatList();
      }
      else{
        this.reserveForm.markAllAsTouched();
        this.optionsSelected = false;
        this.seatList=[];
      }
    }
  
    getSeatList(){
      this.seatSearchParams.libraryId = this.reserveData.libraryId;
      this.seatSearchParams.floorNum = this.planta?.value;
      this.seatService.getSeatList(this.seatSearchParams).subscribe((seats) =>{
        this.seatList = seats.items;
        this.reserveSearchParams.floor = this.planta?.value;
        this.reserveSearchParams.reserveDate = new Date(this.fechaReserva?.value).toISOString().split('T')[0];
        this.reserveSearchParams.libraryId = this.seatSearchParams.libraryId;
        this.reserveService.getReserveList(this.reserveSearchParams).subscribe((reserves) => {
          const reservedSeatNums = new Set(reserves.items.map(r => r.seatNum));
  
          this.seatList = this.seatList.map(seat => {
            if(reservedSeatNums.has(seat.seatNum)){
              seat.status = SeatStatus.reserved;
            }
            return seat;
          });
        })
      })
    }
  
    getTitle(seat: SeatDetails){
      let text="Asiento: " + seat.seatNum + "- " + seat.status;
      text += seat.hasWindow ? " con ventana" : "";
      text += seat.hasSocket ? " con enchufe" : "";
      text += seat.isWCNear ? " cerca del baño" : "";
      return text;
    }
  
    selectedSeat(seat: SeatDetails){
      if(seat.status === SeatStatus.available && this.editMode && this.isOwner){
        this.asiento?.setValue(seat);
        this.selectedSeatId = seat.id;
      }
    }
  
    getSeatsGroupedByRoom(): Map<number, SeatDetails[][]> {
      let grouped = new Map<number, SeatDetails[][]>();
  
      let seatsByRoom = this.seatList.reduce((acc, seat) =>{
        if(!acc[seat.roomNum]) acc[seat.roomNum] = [];
        acc[seat.roomNum].push(seat);
        return acc;
      }, {} as Record<number, SeatDetails[]>);
  
      for(const room in seatsByRoom){
        const seats = seatsByRoom[room];
        let rows: SeatDetails[][] = [];
  
        for(let i=0; i<seats.length; i+=6){
          rows.push(seats.slice(i,i+6));
        }
        grouped.set(Number(room), rows);
      }
      return grouped;
    }
  
    onSent() {
      this.formSent = true;
      this.clearedErrors.clear();
      console.log(this.reserveForm.value, '')
  
      if(this.reserveForm.valid){
        console.log("válido");
        console.log('Datos del formulario:', this.reserveForm.value);
  
        const seatSelected = this.asiento?.value;
  
        let conditions = "¡Importante!: Si no acudes a la reserva sin cancelación previa, se te aplicará una penalización"
                        + "que puede afectar a tus futuras reservas. Te recomendamos anularla con antelación si no vas a asistir";
        let reserveText = "Tu reserva: \n Asiento: " + seatSelected.seatNum + " Fecha: " + this.fechaReserva?.value + " \n" +
                          "Biblioteca: " + this.libraryName + " Planta: " + this.planta?.value + " Sala: " + seatSelected.roomNum + "\n El asiento tiene: ";
        reserveText += seatSelected.hasWindow ? "ventana," : "";
        reserveText += seatSelected.hasSocket ? " enchufe," : "";
        reserveText += seatSelected.isWCNear ? " cerca del baño" : "";
        reserveText += "\n\n";
  
  
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '350px',
          data: {
            title: 'Confirma tus cambios. ¿Estás seguro?',
            message: reserveText + conditions
          }
        });
  
        dialogRef.afterClosed().subscribe(result => {
          if (result === true) {
            this.updateReserve()
          }
        })
        
      }
      else{
        console.log("no valido");
        this.reserveForm.markAllAsTouched();
      }
    }

    private updateReserve(){
      let updatedReserve = this.mapFormToUpdateReserve();
      updatedReserve.reserveDate = new Date(updatedReserve.reserveDate).toISOString().split('T')[0]
      console.log("Datos update", updatedReserve)
      this.reserveService.updateReserve(this.reserveId, updatedReserve).subscribe({
        next:() =>{
          console.log("done");
          this.snackBar.open('Se ha actualizado correctamente la reserva.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.location.back();
        },
        error: (err) => {
          console.error('Error al actualizar la reserva.', err);
          this.snackBar.open('Error al actualizar la reserva.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      })
    }

    goBack(){
      console.log("volviendo");
      this.location.back();
    }

    private mapFormToUpdateReserve() {
      const v = this.reserveForm.getRawValue(); 
      let updatedReserve: ReserveDetails = { ...this.reserveData };
      
          
      if (v.planta !== this.reserveData.floorNum) updatedReserve.floorNum = v.planta;
      if (v.fechaReserva !== this.reserveData.reserveDate) updatedReserve.reserveDate = v.fechaReserva;
      if (v.asiento !== this.reserveData.seatReservedId) updatedReserve.seatReservedId = v.asiento.id;
  
      return updatedReserve;
    }

  
    getFirstHalf(row: any[]): any[] {
      const half = Math.ceil(row.length/2);
      return row.slice(0,half);
    }
  
    getSecondHalf(row: any[]): any[] {
      const half = Math.ceil(row.length/2);
      return row.slice(half);
    }
  
    groupTablesinPairs(rows: SeatDetails[][]): SeatDetails[][][]{
      let result: SeatDetails[][][] = [];
      for (let i=0; i<rows.length; i+=2){
        result.push(rows.slice(i,i+2));
      }
      return result;
    }

    deleteReserve(){
      if(!this.checkValidStatus(this.reserveData)){
        this.snackBar.open('No puedes borrar una que ya ha sido marcada.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
      }
      else if(!this.checkIfCanEditOrDelete()){
        this.snackBar.open('No puedes eliminar esta reseva', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
      }
      else {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '350px',
          data: {
            title: '¿Estás seguro?',
            message: 'Vas a cancelar esta reserva del sistema. Esta acción no se puede deshacer.'
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result === true) {
            this.reserveService.deleteReserve(this.reserveData.id.toString()).subscribe({
              next:() =>{
                this.snackBar.open('Reserva eliminada', 'Cerrar', {
                  duration: 5000,
                  panelClass: ['snackbar-success']
                });
                this.location.back();
              },
              error: (err) => {
                console.error('Error al borrar la reserva:', err);
                this.snackBar.open('Error al borrar la reserva. '+ err.error, 'Cerrar', {
                  duration: 3000,
                  panelClass: ['snackbar-error']
                });
              }
            })
          }
        });
      }

  }

  checkValidStatus(reserve:ReserveDetails): boolean{
    return reserve.status !== '';
  }
    
    get planta() {
      return this.reserveForm.get('planta');
    }
    get fechaReserva() {
      return this.reserveForm.get('fechaReserva');
    }
    get asiento(){
      return this.reserveForm.get('asiento');
    }

}
