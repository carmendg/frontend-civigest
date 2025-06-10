import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbTypeahead, NgbTypeaheadModule, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { LibraryService } from '../../services/library.service';
import { SeatService } from '../../services/seat.service';
import { LibraryDetails, LibrarySearchParams } from '../../models/library.model';
import { catchError, debounceTime, distinctUntilChanged, filter, map, merge, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { PagedResponse } from '../../models/paged-response.model';
import { CreateSeat, SeatStatus } from '../../models/seat.model';
import * as CustomValidators  from '../../validators/validators';

@Component({
  selector: 'app-seatnew',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTypeaheadModule],
  templateUrl: './seatnew.component.html',
  styleUrl: './seatnew.component.css'
})
export class SeatnewComponent implements OnInit{

  seatForm: FormGroup;
  formSent = false;
  biblioSelected = false;
  clearedErrors: Set<string> = new Set();
  filteredLibraries: LibraryDetails [] =[];
  floorNumberList: number[] =[];

  @ViewChild('libraryInstance', {static: true}) libraryInstance!: NgbTypeahead;
  @ViewChild('libraryInput', {static:true}) libraryInput!:ElementRef<HTMLInputElement>;
  libraryFocus$ = new Subject<string>

  librarySearchParams: LibrarySearchParams={
      npag:0,
      nelem:10,
      orderBy:'asc',
      orderField:'nombre'
  }

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar, private activatedRoute: ActivatedRoute,
        private libraryService: LibraryService, private seatService: SeatService){

          this.seatForm = this.formbuilder.group({
            planta: ['', [Validators.required, CustomValidators.isValidFloorNumber(this.floorNumberList)]],
            sala:['', [Validators.required, CustomValidators.isPositiveOrZeroNumber()]],
            asiento: ['', [Validators.required, CustomValidators.isPositiveOrZeroNumber()]],
            ventana: [false],
            enchufe: [false],
            wc: [false],
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

  getLibraryFromParams(libraryId:number){
    this.libraryService.getLibrary(libraryId+'').subscribe({
      next:(l) =>{
        this.biblio?.setValue(l);
        this.librarySearchParams.name = l.name;
        this.biblioSelected = true;
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

  onSent() {
    this.formSent = true;
    this.clearedErrors.clear();
    console.log(this.seatForm.value, '')

    if(this.seatForm.valid){
      console.log("válido");
      console.log('Datos del formulario:', this.seatForm.value);
      const newSeat = this.mapFormToCreateSeat();
      this.seatService.create(newSeat).subscribe({
        next: () => {
          console.log("done");
          this.snackBar.open('Asiento creado', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/seatlist'], { queryParams: { libraryId: newSeat.libraryId } });
        },
        error: (err) => {
          console.error('Error al crear el asiento:', err);
          this.snackBar.open('Error al crear el asiento.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
    else{
      console.log("no valido");
      this.seatForm.markAllAsTouched();
    }
  }

  private mapFormToCreateSeat(): CreateSeat {
    const v = this.seatForm.value;
    return {
      seatNum: v.asiento,
      floorNum: v.planta,
      roomNum: v.sala,
      hasWindow: v.ventana,
      hasSocket: v.enchufe,
      isWCNear: v.wc,
      libraryId: v.biblio.id,
      status: SeatStatus.available
    };
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

}
