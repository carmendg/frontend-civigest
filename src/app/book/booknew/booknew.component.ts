import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { AuthorService } from '../../services/author.service';
import * as CustomValidators from '../../validators/validators';
import { CreateBook } from '../../models/book.model';
import { AuthorDetails } from '../../models/author.model';
import { MatDialog } from '@angular/material/dialog';
import { AuthorSelectorDialogComponent } from '../../shared/author-selector-dialog/author-selector-dialog.component';

@Component({
  selector: 'app-booknew',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './booknew.component.html',
  styleUrl: './booknew.component.css'
})
export class BooknewComponent{

  bookForm: FormGroup;
  formSent = false;
  clearedErrors: Set<string> = new Set();

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar,
    private bookService: BookService, private authorService: AuthorService, private dialog:MatDialog) {
 
      this.bookForm = this.formbuilder.group({

        titulo: [ '', [Validators.required, CustomValidators.nameValidator(), CustomValidators.requiredValidator()] ],
        isbn: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.isbnValidator()]  ],
        editorial: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.nameValidator()] ],
        numpag: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.isValidNumPag()] ], 
        fechaPubli: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.noFutureDateValidator()] ],
        resumen: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator()] ],
        foto:['',[Validators.required]],
        fotoMimeType:[''],
        autores:[[], Validators.required]
      });
    
  }

  onFocus(fieldName: string):void {
    this.clearedErrors.add(fieldName);
  }

  removeAuthor(author: AuthorDetails){
    const current = this.autores?.value || [];
    this.autores?.setValue(current.filter((a: AuthorDetails) => a.id !== author.id))
  }

  onSent() {
    this.formSent = true;
    this.clearedErrors.clear();

    if(this.bookForm.valid){
      console.log("válido");
      console.log('Datos del formulario:', this.bookForm.value);
      const newBook = this.mapFormToCreateBook();
      console.log(newBook);
      this.bookService.create(newBook).subscribe({
        next: () => {
          console.log("done");
          this.snackBar.open('Libro creado', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/booklist']);
        },
        error: (err) => {
          console.error('Error al crear el libro:', err);
          this.snackBar.open('Error al crear el libro.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
    else{
      console.log("no valido");
      console.log('Datos del formulario:', this.bookForm.value);
      this.bookForm.markAllAsTouched();
    }
  }

  private mapFormToCreateBook(): CreateBook {
    const v = this.bookForm.value;
    return {
      isbn: v.isbn,
      title: v.titulo,
      summary: v.resumen,
      pagNum: v.numpag + '',
      publisher: v.editorial,
      publicationDate: new Date(v.fechaPubli).toISOString().split('T')[0],
      photo: v.foto,
      photoMimeType: v.fotoMimeType,
      AuthorIds: v.autores.map((a: any) => a.id)
    };
  }

  openAuthorDialog(): void{
    const dialogRef = this.dialog.open(AuthorSelectorDialogComponent, {
      width: '600px',
      data: {
        title: 'Selecciona autores',
        selectedAuthors: this.autores?.value
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if(Array.isArray(result)){
        this.autores?.setValue(result);
      }
    });
  }

  
  onImageSelected(event: any){
    const file = event.target.files[0]
    if (file){
      if(file.type.startsWith('image/')){
        const reader = new FileReader();
        reader.onload =() =>{
          const base64String = (reader.result as string).split(',')[1];
          const mimeType = file.type;

          this.bookForm.patchValue({
            foto: base64String,
            fotoMimeType: mimeType
          })
        };
        reader.readAsDataURL(file);
      }
    }
  }

  get titulo() {
    return this.bookForm.get('titulo');
  }

  get isbn() {
    return this.bookForm.get('isbn');
  }

  get editorial() {
    return this.bookForm.get('editorial');
  }

  get numpag() {
    return this.bookForm.get('numpag');
  }

  get fechaPubli() {
    return this.bookForm.get('fechaPubli');
  }

  get foto(){
    return this.bookForm.get('foto');
  }

  get resumen() {
    return this.bookForm.get('resumen');
  }

  get autores() {
    return this.bookForm.get('autores')
  }

}
