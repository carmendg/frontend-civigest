import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthorService } from '../../services/author.service';
import { MatDialog } from '@angular/material/dialog';
import { BookService } from '../../services/book.service';
import { BookDetails } from '../../models/book.model';
import * as CustomValidators  from '../../validators/validators';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Role } from '../../models/user.model';
import { AuthorSelectorDialogComponent } from '../../shared/author-selector-dialog/author-selector-dialog.component';
import { AuthorDetails } from '../../models/author.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-bookview',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bookview.component.html',
  styleUrl: './bookview.component.css'
})
export class BookviewComponent implements OnInit{

  bookForm: FormGroup;
  bookData!: BookDetails;
  formSent = false;
  clearedErrors: Set<string> = new Set();
  name: string = '';
  bookId: string = '';
  editMode = false;
  canEditOrDelete = false;
  usernameCreatedBy: string = '';
  isClient = true;

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar,
    private bookService: BookService, private authorService: AuthorService, private dialog:MatDialog,
    private activatedRoute: ActivatedRoute, private authService: AuthService, private userService: UserService) {
 
      this.bookForm = this.formbuilder.group({

        titulo: [ '', [Validators.required, CustomValidators.nameValidator(), CustomValidators.requiredValidator()] ],
        isbn: [{value: '', disabled:true} ],
        editorial: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.nameValidator()] ],
        numpag: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.isValidNumPag()] ], 
        fechaPubli: [{value: '', disabled:true} ],
        resumen: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator()] ],
        foto:['',[Validators.required]],
        fotoMimeType:[''],
        autores:[[], Validators.required]
      });
    
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.bookId = params['id'];      
      this.bookService.getBook(this.bookId).subscribe(book => {
        if (book) {
          console.log(book);
          this.bookData = book;
          this.fillValuesForm(book);
          this.name=book.title;
          this.isClient = this.checkIfClientUser();
          if(!this.isClient){
            this.userService.getUser(book.userCreatedId).subscribe({
              next:(u) =>{
                book.usernameCreatedBy = u.name + " " + u.surname;
                this.usernameCreatedBy = book.usernameCreatedBy;
                this.canEditOrDelete = this.checkIfCanEditOrDelete();
                if(!this.canEditOrDelete) this.editMode=false;
                if(this.editMode) this.habilitarEdicion();
              },
              error: (err) => {
                book.usernameCreatedBy="Anónimo"
                this.canEditOrDelete = this.checkIfCanEditOrDelete();
                if(!this.canEditOrDelete) this.editMode=false;
                if(this.editMode) this.habilitarEdicion();
              }
            });
          }
        }
      });
      
    });
  }

  fillValuesForm(book: BookDetails): void{
    this.bookForm.patchValue({
      titulo: book.title,
      isbn: book.isbn,
      editorial: book.publisher,
      numpag: book.pagNum,
      fechaPubli: book.publicationDate,
      foto: book.photo,
      fotoMimeType: book.photoMimeType,
      resumen: book.summary,
      autores: book.authorIds ?? []
    });
  }

  onSent():void{
    this.formSent = true;
    this.clearedErrors.clear();

    if(this.bookForm.valid){
      console.log("válido");
      console.log(this.bookData)
      console.log('Datos del formulario:', this.bookForm.value);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirma actualización',
          message: '¿Estás seguro de que quieres actualizar este libro?.\nEsta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.updateBook();
        }
      });
    }
    else{
      console.log("no valido");
      this.bookForm.markAllAsTouched();
    }
  }

  private updateBook(){
    let updatedBook = this.mapFormToUpdateBook();
    updatedBook.pagNum = updatedBook.pagNum + '';
    console.log("Datos update", updatedBook)
    this.bookService.updateBook(this.bookId, updatedBook).subscribe({
      next:() =>{
        console.log("done");
        this.snackBar.open('Se ha actualizado correctamente el libro.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/booklist']);
      },
      error: (err) => {
        console.error('Error al actualizar el libro:', err);
        this.snackBar.open('Error al actualizar el libro.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    })
  }

  private mapFormToUpdateBook() {
    const v = this.bookForm.getRawValue(); 
    let updatedBook: BookDetails = { ...this.bookData };
    updatedBook.usernameCreatedBy = undefined;
        
    if (v.titulo !== this.bookData.title) updatedBook.title = v.titulo;
    if (v.editorial !== this.bookData.publisher) updatedBook.publisher = v.editorial;
    if (v.numpag !== this.bookData.pagNum) updatedBook.pagNum = v.numpag;
    if (v.resumen !== this.bookData.summary) updatedBook.summary = v.resumen;
    if (v.autores !== this.bookData.authorIds) updatedBook.authorIds = v.autores;
    if (v.foto !== this.bookData.photo){
      updatedBook.photo = v.foto;
      updatedBook.photoMimeType = v.fotoMimeType
    }


    return updatedBook;
  }

  deleteBook(): void{ //Editar para controlar con los ejemplares
      if(!this.checkIfCanEditOrDelete()){
        this.snackBar.open('No tienes permisos para borrar este libro', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
      }
      else{
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '350px',
          data: {
            title: '¿Estás seguro?',
            message: 'Vas a eliminar a este libro del sistema. Esta acción no se puede deshacer.'
          }
        });
  
        dialogRef.afterClosed().subscribe(result => {
          if (result === true) {
            this.bookService.deleteBook(this.bookData.id.toString()).subscribe({
              next:() =>{
                this.snackBar.open('Libro eliminado', 'Cerrar', {
                  duration: 5000,
                  panelClass: ['snackbar-success']
                });
                this.router.navigate(['/booklist']);
              },
              error: (err) => {
                console.error('Error al borrar el libro:', err);
                this.snackBar.open('Error al borrar el libro', 'Cerrar', {
                  duration: 3000,
                  panelClass: ['snackbar-error']
                });
              }
            })
          }
        });
      }
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

  removeAuthor(author: AuthorDetails){
    const current = this.autores?.value || [];
    this.autores?.setValue(current.filter((a: AuthorDetails) => a.id !== author.id))
  }

  onFocus(fieldName: string): void {
    this.clearedErrors.add(fieldName);
  }

  checkIfClientUser(): boolean{
    const userrole= this.authService.getRoleFromToken();
    if(userrole && (userrole === Role.admin || userrole === Role.gestor)) return false;
    return true;
  } 

  checkIfCanEditOrDelete(): boolean{
    const userrole= this.authService.getRoleFromToken();
    const userId = this.authService.getUserIdFromToken();
    if(userrole && userrole === Role.admin) return true;
    else if(userId && userId === this.bookData.userCreatedId) return true;
    else if(userrole && userId && this.bookData && this.bookData.usernameCreatedBy && this.bookData.usernameCreatedBy === "Anónimo") return true;
    else return false;
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

   deshabilitarEdicion(): void {
    this.editMode = false;
    this.bookForm.get('titulo')?.clearValidators();
    this.bookForm.get('titulo')?.updateValueAndValidity();

    this.bookForm.get('editorial')?.clearValidators();
    this.bookForm.get('editorial')?.updateValueAndValidity();

    this.bookForm.get('numpag')?.clearValidators();
    this.bookForm.get('numpag')?.updateValueAndValidity();

    this.bookForm.get('foto')?.clearValidators();
    this.bookForm.get('foto')?.updateValueAndValidity();

    this.bookForm.get('resumen')?.clearValidators();
    this.bookForm.get('resumen')?.updateValueAndValidity();

    this.bookForm.get('autores')?.clearValidators();
    this.bookForm.get('autores')?.updateValueAndValidity();
  }

  habilitarEdicion(): void {
    if(this.checkIfCanEditOrDelete()){
      this.editMode = true;

      //Aplicamos los validadores del título
      this.bookForm.get('titulo')?.setValidators([
        Validators.required, CustomValidators.nameValidator(), CustomValidators.requiredValidator() 
      ]);
      this.bookForm.get('titulo')?.updateValueAndValidity();

      //Aplicamos los validadores de la editorial
      this.bookForm.get('editorial')?.setValidators([
        Validators.required, CustomValidators.requiredValidator(), CustomValidators.nameValidator()
      ]);
      this.bookForm.get('editorial')?.updateValueAndValidity();

      //Aplicamos los validadores del número de páginas
      this.bookForm.get('numpag')?.setValidators([
        Validators.required, CustomValidators.requiredValidator(), CustomValidators.isValidNumPag() 
      ]);
      this.bookForm.get('numpag')?.updateValueAndValidity();

      //Aplicamos los validadores de la foto
      this.bookForm.get('foto')?.setValidators([
        Validators.required, CustomValidators.requiredValidator() 
      ]);
      this.bookForm.get('foto')?.updateValueAndValidity();

      //Aplicamos los validadores del resumen
      this.bookForm.get('resumen')?.setValidators([
        Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator() 
      ]);
      this.bookForm.get('resumen')?.updateValueAndValidity();

      //Aplicamos los validadores de los autores
      this.bookForm.get('autores')?.setValidators([
        Validators.required, CustomValidators.requiredValidator() 
      ]);
      this.bookForm.get('autores')?.updateValueAndValidity();
    }
  }

  goBack(){
    console.log("volviendo");
    this.router.navigate(['/booklist']);

  }

  viewCopyBook(){
    console.log("Hacia los ejemplares")
    this.router.navigate(['/copybooklist'], { queryParams: { bookId: this.bookId } })
  }

  addCopyBook(){
    console.log("Hacia nuevo ejemplar")
    this.router.navigate(['/copybooknew'], { queryParams: { bookId: this.bookId } })
  }

  get titulo() {
    return this.bookForm.get('titulo');
  }

  get editorial() {
    return this.bookForm.get('editorial');
  }

  get numpag() {
    return this.bookForm.get('numpag');
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
