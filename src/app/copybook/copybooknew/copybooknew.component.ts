import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { CreateCopyBook } from '../../models/copybook.model';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CopybookService } from '../../services/copybook.service';
import { LibraryService } from '../../services/library.service';
import { BookService } from '../../services/book.service';
import * as CustomValidators  from '../../validators/validators';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, Subject, switchMap, tap } from 'rxjs';
import { BookDetails, BookSearchParams } from '../../models/book.model';
import { PagedResponse } from '../../models/paged-response.model';

@Component({
  selector: 'app-copybooknew',
  imports: [NgSelectModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './copybooknew.component.html',
  styleUrl: './copybooknew.component.css'
})
export class CopybooknewComponent implements OnInit{

  copybookForm: FormGroup;
  formSent = false;
  clearedErrors: Set<string> = new Set();
  bookSearchInput$ = new Subject<string>();
  filteredBooks: BookDetails[] = [];
  selectedBookTitle: string='';
  selectedBookId: number | null = null;
  

  @ViewChild('bookSelect') bookSelect!: NgSelectComponent
  bookSearchParams: BookSearchParams={
    npag:0,
    nelem:10,
    orderBy:'asc',
    orderField:'titulo'
  };

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar,
    private copybookService: CopybookService, private libraryService: LibraryService, private bookService: BookService){
      
      this.copybookForm = this.formbuilder.group({
        ubicacion: [ '', [Validators.required, CustomValidators.addressValidator(), CustomValidators.requiredValidator()] ],
        edicion: ['',[Validators.required, CustomValidators.isValidNumPag(), CustomValidators.nameValidator()]  ], 
        libro: ['',[Validators.required, CustomValidators.requiredValidator()] ],
        biblio: ['',[Validators.required, CustomValidators.requiredValidator()] ],
      });
  }

  ngOnInit(): void {
    this.bookService.getBookList(this.bookSearchParams).subscribe(book =>{ this.filteredBooks= book.items
      console.log("algo", this.filteredBooks);
    });

    this.bookSearchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => term.length >= 2),
      switchMap((term:string) => {
        this.bookSearchParams.title=term;
        return this.bookService.getBookList(this.bookSearchParams).pipe(
          map((response:PagedResponse<BookDetails>) => response.items),
          catchError(() => of([])),
        );          
      })
    ).subscribe(books => {this.filteredBooks=books
      console.log('esto', this.filteredBooks)
    });

    /*this.bookSearchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => typeof term ==='string'),
      tap(()=> (this.isLoading=true)),
      switchMap((term:string) => {
        if(term.length >= 2)
        {
          this.bookSearchParams.title=term;
          return this.bookService.getBookList(this.bookSearchParams).pipe(
            map((response:PagedResponse<BookDetails>) => response.items),
            catchError(() => of([])),
            tap(() => (this.isLoading =false))
          );
        }
        else return of([])          
      })
    ).subscribe(books => {this.filteredBooks=books
      console.log('esto', this.filteredBooks)
    });*/

        this.copybookForm.get('libro')?.valueChanges.subscribe(val => {
        console.log('Valor libro cambiado:', val);
      });
  }

  onBookInput(event: Event): void{
    const input = (event.target as HTMLInputElement).value;
    this.selectedBookTitle = input;
    this.bookSearchInput$.next(input);
    
    const match = this.filteredBooks.find(b => b.title === input);
    if(match){
      this.selectedBookId = match.id;
      this.libro?.setValue(match.id);
    }
    else {
      this.selectedBookId = null;
      this.libro?.setValue(null);
    }
  }
  
  onFocus(fieldName: string): void {
    this.clearedErrors.add(fieldName);
  }

  /*onBookSelected(selectedId: number): void{
    console.log(this.copybookForm.get('libro'), 'aqui')
    this.copybookForm.get('libro')?.setValue(selectedId);
    this.bookSelect.close();
    this.bookDropDownOpen=false;
  }*/

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
      bookId: v.libro,
      libraryId: v.biblio,
      editionNum: v.edicion,
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
