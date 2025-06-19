import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTypeahead, NgbTypeaheadModule, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import * as CustomValidators  from '../../validators/validators';
import { LibraryDetails, LibrarySearchParams } from '../../models/library.model';
import { catchError, debounceTime, distinctUntilChanged, filter, map, merge, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LibraryService } from '../../services/library.service';
import { SeatService } from '../../services/seat.service';
import { ReserveService } from '../../services/reserve.service';
import { PagedResponse } from '../../models/paged-response.model';
import { SeatDetails, SeatSearchParams, SeatStatus } from '../../models/seat.model';
import { CreateReserve, ReserveSearchParams } from '../../models/reserve.model';
import { AuthService } from '../../services/auth.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-reservenew',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTypeaheadModule],
  templateUrl: './reservenew.component.html',
  styleUrl: './reservenew.component.css'
})
export class ReservenewComponent implements OnInit{

  reserveForm: FormGroup;
  formSent = false;
  loadSent = false;
  optionsSelected = false;
  clearedErrors: Set<string> = new Set();
  filteredLibraries: LibraryDetails [] =[];
  floorNumberList: number[] =[];
  libraryName = '';
  biblioSelected = false;
  seatList: SeatDetails[] = [];
  selectedSeatId: number | null = null;

  @ViewChild('libraryInstance', {static: true}) libraryInstance!: NgbTypeahead;
  @ViewChild('libraryInput', {static:true}) libraryInput!:ElementRef<HTMLInputElement>;
  libraryFocus$ = new Subject<string>

  librarySearchParams: LibrarySearchParams={
      npag:0,
      nelem:10,
      orderBy:'asc',
      orderField:'nombre'
  }

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
        private libraryService: LibraryService, private seatService: SeatService, private reserveService: ReserveService, private authService: AuthService, private location: Location ){

          this.reserveForm = this.formbuilder.group({
            planta: ['', [Validators.required, CustomValidators.isValidFloorNumber(this.floorNumberList)]],
            fechaReserva: ['', [Validators.required, CustomValidators.NoPastDateValidator()]],
            asiento: ['', [Validators.required]],
            biblio:['',[Validators.required] ],
          })
  }

  ngOnInit(): void {

    this.libraryService.getLibraryList(this.librarySearchParams).subscribe(library => { this.filteredLibraries = library.items });

     this.activatedRoute.params.subscribe(params => {
        const libraryIdParam = this.activatedRoute.snapshot.queryParamMap.get('libraryId');
        const libraryId = libraryIdParam !== null ? +libraryIdParam : NaN;
        if(!isNaN(libraryId)) this.getLibraryFromParams(libraryId);
    })
    
  }

  getLibraryFromParams(libraryId:number){
    this.libraryService.getLibrary(libraryId+'').subscribe({
      next:(l) =>{
        this.biblio?.setValue(l);
        this.librarySearchParams.name = l.name;
        this.libraryName = l.name;
        this.fillFloorNumbers(+(l.floorNumbers));
        console.log(this.floorNumberList)
        console.log(l.floorNumbers)
      },
      error: (err) => {
        console.error('Error al obtener biblioteca:', err);
        this.snackBar.open('Ha ocurrido un error.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        this.router.navigate(['/']);
      }
    });
    
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

  searchLibraries = (text$: Observable<string>): Observable<LibraryDetails[]> => {
    const debouncedText$ = text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => term.length >= 2)
      );

    //Mostramos la lista sugerida, la primera vez
      const focusOrEmpty$ = this.libraryFocus$.pipe(
      switchMap(() =>{
        return this.libraryService.getLibraryList(this.librarySearchParams).pipe(
          map( res => res.items),
          catchError(() => of([]))
        );
      })
      );

      //Si está escribiendo traemos los nuevos datos
      return merge(debouncedText$.pipe(
        switchMap((term:string) => {
        this.librarySearchParams.name=term;
        return this.libraryService.getLibraryList(this.librarySearchParams).pipe(
          map((response:PagedResponse<LibraryDetails>) => response.items),
          catchError(() => of([])),
        );          
      }),
      tap(library => this.filteredLibraries = library)
      ),focusOrEmpty$ )
  }

  libraryFormatter = (library: LibraryDetails) => library.name;

  libraryInputFormatter = (library: LibraryDetails | number | null) => {
    if (typeof library === 'object' && library !== null){
      return library.name
    }
    const found = this.filteredLibraries.find(l => l.id === library);
    return found ? found.name : ''
  }

  onLibrarySelected(event: NgbTypeaheadSelectItemEvent<LibraryDetails>) {
    this.biblioSelected = true;
    const floor = +(event.item.floorNumbers);
    this.fillFloorNumbers(floor);
    this.libraryInstance.dismissPopup();

  }

  validateLibraryInput(): void{
    const inputValue = this.libraryInput.nativeElement.value?.trim();
    const match = this.filteredLibraries.find(library => library.name === inputValue);
    if (!match){
      this.biblio?.setValue('');
      this.biblioSelected = false;
    }
  }

  loadSeat(){
    this.selectedSeatId=null;
    this.asiento?.setValue('');
    this.loadSent = true;
    this.clearedErrors.clear();
    this.checkAndLoadSeats()
  }

  private shouldEnableSeatSelection(): boolean{
    if(this.biblio?.valid && this.planta?.valid && this.fechaReserva?.valid){
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
    this.seatSearchParams.libraryId = this.biblio?.value.id;
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
    console.log("aaqi")
    if(seat.status === SeatStatus.available){
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
      const newReserve: CreateReserve = {
        reserveDate: new Date(this.fechaReserva?.value).toISOString().split('T')[0],
        seatReservedId: this.selectedSeatId +''
      }

      const seatSelected = this.asiento?.value;

      let conditions = "¡Importante!: Si no acudes a la reserva sin cancelación previa, se te aplicará una penalización"
                      + "que puede afectar a tus futuras reservas. Te recomendamos anularla con antelación si no vas a asistir";
      let reserveText = "Tu reserva: \n Asiento: " + seatSelected.seatNum + " Fecha: " + newReserve.reserveDate + " \n" +
                        "Biblioteca: " + this.biblio?.value.name + " Planta: " + this.planta?.value + " Sala: " + seatSelected.roomNum + "\n El asiento tiene: ";
      reserveText += seatSelected.hasWindow ? "ventana," : "";
      reserveText += seatSelected.hasSocket ? " enchufe," : "";
      reserveText += seatSelected.isWCNear ? " cerca del baño" : "";
      reserveText += "\n\n";


      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: '¿Estás seguro?',
          message: reserveText + conditions
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.createReserve(newReserve)
        }
      })
      
    }
    else{
      console.log("no valido");
      this.reserveForm.markAllAsTouched();
    }
  }

  private createReserve(newReserve: CreateReserve){
    this.reserveService.create(newReserve).subscribe({
      next: () => {
        let userId = this.authService.getUserIdFromToken();
        console.log("done");
        this.snackBar.open('Reserva creada', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/reservelist'], { queryParams: { userId: userId } });
      },
      error: (err) => {
        console.error('Error al realizar la reserva:', err);
        console.log(err.error.error);
        this.snackBar.open('Error al realizar la reserva. ' + err.error.error, 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        this.location.back()
      }
    });
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




  get biblio() {
    return this.reserveForm.get('biblio');
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
