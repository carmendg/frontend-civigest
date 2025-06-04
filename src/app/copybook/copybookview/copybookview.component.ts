import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CopyBookDetails, CopyBookStatus } from '../../models/copybook.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BookService } from '../../services/book.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CopybookService } from '../../services/copybook.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import * as CustomValidators  from '../../validators/validators';
import { LibraryService } from '../../services/library.service';
import { Role } from '../../models/user.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-copybookview',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './copybookview.component.html',
  styleUrl: './copybookview.component.css'
})
export class CopybookviewComponent implements OnInit {

  copybookForm: FormGroup;
  copybookData!: CopyBookDetails;
  formSent = false;
  clearedErrors: Set<string> = new Set();
  title: string = '';
  name:string ='';
  copybookId: string = '';
  editMode = false;
  canEditOrDelete = false;
  usernameCreatedBy: string = '';
  isClient = true;
  statuses = Object.entries(CopyBookStatus).map(([key,value]) =>({value:key, label:value}));

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar,
    private bookService: BookService, private dialog:MatDialog, private copyBookService: CopybookService,
    private activatedRoute: ActivatedRoute, private authService: AuthService, private userService: UserService,
    private libraryService: LibraryService, private location: Location)
    {
      this.copybookForm = this.formbuilder.group({

        biblio: [ {value: '', disabled:true} ],
        libro: [{value: '', disabled:true} ],
        ubicacion: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.addressValidator()] ],
        edicion: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.isValidNumPag()] ], 
        fecha: [{value: '', disabled:true} ],
        comentario: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator()] ],
        estado:[''],
      });

    }
  
  ngOnInit(): void {
    console.log(this.statuses)
    this.activatedRoute.params.subscribe(params => {
      this.copybookId = params['id'];
      this.editMode = this.activatedRoute.snapshot.queryParamMap.get('edit') === 'true';
      this.copyBookService.getCopyBook(this.copybookId).subscribe((copy:CopyBookDetails)=> {
        if (copy) {
          console.log(copy);
          this.copybookData = copy;
          this.fillValuesForm(copy);

          this.bookService.getBook(copy.bookId + '').subscribe({
            next:(b) =>{
              copy.bookTitle = b.title;
              this.libro?.setValue(b.title);
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

          this.libraryService.getLibrary(copy.libraryId + '').subscribe({
            next:(l) =>{
              copy.libraryName = l.name;
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

          this.userService.getUser(copy.userCreatedId).subscribe({
            next:(u) =>{
              copy.usernameCreatedBy = u.name + " " + u.surname;
              this.usernameCreatedBy = copy.usernameCreatedBy;
              this.canEditOrDelete = this.checkIfCanEditOrDelete();
              this.isClient = this.checkIfClientUser();
              if(!this.canEditOrDelete) this.editMode=false;
              if(this.editMode) this.habilitarEdicion();
            },
            error: (err) => {
              copy.usernameCreatedBy="Anónimo"
              this.canEditOrDelete = this.checkIfCanEditOrDelete();
              if(!this.canEditOrDelete) this.editMode=false;
              if(this.editMode) this.habilitarEdicion();
            }
          });
        }
      });
      
    });
  }

  fillValuesForm(copybook: CopyBookDetails): void{
    this.copybookForm.patchValue({
      edicion: copybook.editionNum,
      comentario: copybook.remarks,
      fecha: copybook.purchaseDate,
      estado: copybook.status,
      ubicacion: copybook.ubication,
    });
  }

  habilitarEdicion(): void {
    if(this.checkIfCanEditOrDelete()){
      this.editMode = true;

      //Aplicamos los validadores de la edicion
      this.edicion?.setValidators([
        Validators.required, CustomValidators.isValidNumPag() 
      ]);
      this.edicion?.updateValueAndValidity();

      //Aplicamos los validadores de la ubicacion
      this.ubicacion?.setValidators([
        Validators.required, CustomValidators.requiredValidator(), CustomValidators.addressValidator()
      ]);
      this.ubicacion?.updateValueAndValidity();

      //Aplicamos los validadores del comentario
      this.comentario?.setValidators([
        Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator() 
      ]);
      this.comentario?.updateValueAndValidity();

      //Aplicamos los validadores del estado
      this.estado?.setValidators([
        Validators.required, CustomValidators.enumValidator(CopyBookStatus) 
      ]);
      this.estado?.updateValueAndValidity();
    }
  }

  deshabilitarEdicion(): void {
    this.editMode = false;
    this.edicion?.clearValidators();
    this.edicion?.updateValueAndValidity();

    this.ubicacion?.clearValidators();
    this.ubicacion?.updateValueAndValidity();

    this.comentario?.clearValidators();
    this.comentario?.updateValueAndValidity();

    this.estado?.clearValidators();
    this.estado?.updateValueAndValidity();
  }


  checkIfClientUser(): boolean{
    const userrole= this.authService.getRoleFromToken();
    if(userrole && (userrole === Role.admin || userrole === Role.gestor)) return false;
    return true;
  } 

  checkIfCanEditOrDelete(): boolean{
    if(this.checkIfReserved()) return false;
    const userrole= this.authService.getRoleFromToken();
    const userId = this.authService.getUserIdFromToken();
    if(userrole && userrole === Role.admin) return true;
    else if(userId && userId === this.copybookData.userCreatedId) return true;
    else if(userrole && userId && this.copybookData && this.copybookData.usernameCreatedBy && this.copybookData.usernameCreatedBy === "Anónimo") return true;
    else return false;
    
  }

  checkIfReserved(): boolean {
    return this.copybookData.status === CopyBookStatus.booked
  }

  onFocus(fieldName: string): void {
    this.clearedErrors.add(fieldName);
  }

  deleteCopyBook(){
    if(this.checkIfReserved()){
      this.snackBar.open('No puedes borrar este ejemplar. Está reservado', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else if(!this.checkIfCanEditOrDelete()){
      this.snackBar.open('No tienes permisos para eliminar este ejemplar', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: '¿Estás seguro?',
          message: 'Vas a eliminar a este ejemplar del sistema. Esta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.copyBookService.deleteCopyBook(this.copybookId.toString()).subscribe({
            next:() =>{
              this.snackBar.open('Ejemplar eliminado', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.location.back();
            },
            error: (err) => {
              console.error('Error al borrar el ejemplar:', err);
              this.snackBar.open('Error al borrar el ejemplar', 'Cerrar', {
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

    if(this.copybookForm.valid){
      console.log("válido");
      console.log(this.copybookData)
      console.log('Datos del formulario:', this.copybookForm.value);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirma actualización',
          message: '¿Estás seguro de que quieres actualizar este ejemplar?.\nEsta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.updateCopyBook();
        }
      });
    }
    else{
      console.log("no valido");
      this.copybookForm.markAllAsTouched();
    }
  }

  private updateCopyBook(){
    let updatedCopyBook = this.mapFormToUpdateCopyBook();
    updatedCopyBook.editionNum = updatedCopyBook.editionNum + '';
    console.log("Datos update", updatedCopyBook)
    this.copyBookService.updateCopyBook(this.copybookId, updatedCopyBook).subscribe({
      next:() =>{
        console.log("done");
        this.snackBar.open('Se ha actualizado correctamente el ejemplar.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.location.back();
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

  private mapFormToUpdateCopyBook() {
    const v = this.copybookForm.getRawValue(); 
    let updatedCopyBook: CopyBookDetails = { ...this.copybookData };
    updatedCopyBook.usernameCreatedBy = undefined;
    updatedCopyBook.bookTitle = undefined;
    updatedCopyBook.libraryName = undefined;
        
    if (v.edicion !== this.copybookData.editionNum) updatedCopyBook.editionNum = v.edicion;
    if (v.ubicacion !== this.copybookData.ubication) updatedCopyBook.ubication = v.ubicacion;
    if (v.comentario !== this.copybookData.remarks) updatedCopyBook.remarks = v.comentario;
    if (v.estado !== this.copybookData.status) updatedCopyBook.status = v.estado;


    return updatedCopyBook;
  }




  goBack(){
    console.log("volviendo");
    this.location.back();
  }

  get biblio(){
    return this.copybookForm.get('biblio')
  }

  get libro(){
    return this.copybookForm.get('libro')
  }

  get edicion(){
    return this.copybookForm.get('edicion')
  }

  get comentario(){
    return this.copybookForm.get('comentario')
  }

  get estado(){
    return this.copybookForm.get('estado')
  }

  get ubicacion(){
    return this.copybookForm.get('ubicacion')
  }





}
