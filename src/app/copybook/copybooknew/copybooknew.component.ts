import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateCopyBook } from '../../models/copybook.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CopybookService } from '../../services/copybook.service';
import { LibraryService } from '../../services/library.service';
import { BookService } from '../../services/book.service';
import * as CustomValidators  from '../../validators/validators';
import { catchError, debounceTime, distinctUntilChanged, filter, map, merge, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { BookDetails, BookSearchParams } from '../../models/book.model';
import { PagedResponse } from '../../models/paged-response.model';
import { NgbTypeahead, NgbTypeaheadModule, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { LibraryDetails, LibrarySearchParams } from '../../models/library.model';


@Component({
  selector: 'app-copybooknew',
  imports: [ CommonModule, FormsModule, ReactiveFormsModule, NgbTypeaheadModule],
  templateUrl: './copybooknew.component.html',
  styleUrl: './copybooknew.component.css'
})
export class CopybooknewComponent implements OnInit{

  copybookForm: FormGroup;
  formSent = false;
  clearedErrors: Set<string> = new Set();
  filteredBooks: BookDetails[] = [];
  filteredLibraries: LibraryDetails [] =[];

  @ViewChild('bookInstance', {static: true}) bookInstance!: NgbTypeahead;
  @ViewChild('bookInput', {static:true}) bookInput!:ElementRef<HTMLInputElement>;
  bookFocus$ = new Subject<string>

  @ViewChild('libraryInstance', {static: true}) libraryInstance!: NgbTypeahead;
  @ViewChild('libraryInput', {static:true}) libraryInput!:ElementRef<HTMLInputElement>;
  libraryFocus$ = new Subject<string>
  

  bookSearchParams: BookSearchParams={
    npag:0,
    nelem:10,
    orderBy:'asc',
    orderField:'titulo'
  };

  librarySearchParams: LibrarySearchParams={
    npag:0,
    nelem:10,
    orderBy:'asc',
    orderField:'nombre'
  }

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar, private activatedRoute: ActivatedRoute,
    private copybookService: CopybookService, private libraryService: LibraryService, private bookService: BookService){
      
      this.copybookForm = this.formbuilder.group({
        ubicacion: [ '', [Validators.required, CustomValidators.addressValidator(), CustomValidators.requiredValidator()] ],
        edicion: ['',[Validators.required, CustomValidators.isValidNumPag(), CustomValidators.requiredValidator()]  ], 
        libro: ['',[Validators.required] ],
        biblio: ['',[Validators.required] ],
      });
  }

  ngOnInit(): void {
    this.bookService.getBookList(this.bookSearchParams).subscribe(book =>{ this.filteredBooks= book.items
      console.log("algo", this.filteredBooks);
    });

    this.libraryService.getLibraryList(this.librarySearchParams).subscribe(library => { this.filteredLibraries = library.items
      console.log("biblio", this.filteredLibraries);
    });

    this.activatedRoute.params.subscribe(params => {
      const bookIdParam = this.activatedRoute.snapshot.queryParamMap.get('bookId');
      const bookId = bookIdParam !== null ? +bookIdParam : NaN;
      if(!isNaN(bookId)){
        this.getBookFromParams(bookId);
      }
      else {
        const libraryIdParam = this.activatedRoute.snapshot.queryParamMap.get('libraryId');
        const libraryId = libraryIdParam !== null ? +libraryIdParam : NaN;
        if(!isNaN(libraryId)) this.getLibraryFromParams(libraryId);
      }
    })

  }

  
  onFocus(fieldName: string): void {
    this.clearedErrors.add(fieldName);
  }

  searchBooks = (text$: Observable<string>): Observable<BookDetails[]> => {
    const debouncedText$ = text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => term.length >= 2)
     );

    //Mostramos la lista sugerida, la primera vez
     const focusOrEmpty$ = this.bookFocus$.pipe(
      switchMap(() =>{
        return this.bookService.getBookList(this.bookSearchParams).pipe(
          map( res => res.items),
          catchError(() => of([]))
        );
      })
     );

     //Si está escribiendo traemos los nuevos datos
     return merge(debouncedText$.pipe(
       switchMap((term:string) => {
        this.bookSearchParams.title=term;
        return this.bookService.getBookList(this.bookSearchParams).pipe(
          map((response:PagedResponse<BookDetails>) => response.items),
          catchError(() => of([])),
        );          
      }),
      tap(books => this.filteredBooks = books)
     ),focusOrEmpty$ )
  }

  bookFormatter = (book: BookDetails) => book.title;

  bookInputFormatter = (book: BookDetails | number | null) => {
    if (typeof book === 'object' && book !== null){
      return book.title
    }
    const found = this.filteredBooks.find(b => b.id === book);
    return found ? found.title : ''
  }

  onBookSelected(event: NgbTypeaheadSelectItemEvent<BookDetails>) {
    /*const book = event.item;
    console.log(book, "libro")
    this.selectedBookId = book.id;*/
   // this.libro?.setValue(this.selectedBookId);
    this.bookInstance.dismissPopup();

  }

  validateBookInput(): void{
    const inputValue = this.bookInput.nativeElement.value?.trim();
    const match = this.filteredBooks.find(book => book.title === inputValue);
    console.log("AQUII")
    if (!match){
      this.libro?.setValue('');
      //this.selectedBookTitle ='';
    }
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
    this.libraryInstance.dismissPopup();

  }

  validateLibraryInput(): void{
    const inputValue = this.libraryInput.nativeElement.value?.trim();
    const match = this.filteredLibraries.find(library => library.name === inputValue);
    console.log("AQUII")
    if (!match){
      this.biblio?.setValue('');
    }
  }

  getBookFromParams(bookId:number){
    this.bookService.getBook(bookId+'').subscribe({
      next:(b) =>{
        this.libro?.setValue(b);
        this.bookSearchParams.title = b.title;

      },
      error: (err) => {
        console.error('Error al obtener libro:', err);
        this.snackBar.open('Ha ocurrido un error.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        this.router.navigate(['/']);
      }
    });   
  }

  getLibraryFromParams(libraryId:number){
    this.libraryService.getLibrary(libraryId+'').subscribe({
      next:(l) =>{
        this.biblio?.setValue(l);
        this.librarySearchParams.name = l.name;
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


  onSent() {
    this.formSent = true;
    this.clearedErrors.clear();
    console.log(this.copybookForm.value, '')

    if(this.copybookForm.valid){
      console.log("válido");
      console.log('Datos del formulario:', this.copybookForm.value);
      const newCopybook = this.mapFormToCreateCopyBook();
      this.copybookService.create(newCopybook).subscribe({
        next: () => {
          console.log("done");
          this.snackBar.open('Ejemplar creado', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/copybooklist']);
        },
        error: (err) => {
          console.error('Error al crear el ejemplar:', err);
          this.snackBar.open('Error al crear el ejemplar.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
    else{
      console.log("no valido");
      this.copybookForm.markAllAsTouched();
    }
  }

  private mapFormToCreateCopyBook(): CreateCopyBook {
    const v = this.copybookForm.value;
    return {
      ubication: v.ubicacion,
      bookId: v.libro.id + '',
      libraryId: v.biblio.id + '',
      editionNum: v.edicion + '',
      remarks: '',
      purchaseDate: new Date().toISOString().split('T')[0]
    };
  }

  get ubicacion() {
    return this.copybookForm.get('ubicacion');
  }

  get edicion() {
    return this.copybookForm.get('edicion');
  }

  get libro() {
    return this.copybookForm.get('libro');
  }

  get biblio() {
    return this.copybookForm.get('biblio');
  }
  

}
