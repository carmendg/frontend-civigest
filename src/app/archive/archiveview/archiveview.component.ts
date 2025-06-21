import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ArchiveDetails } from '../../models/archive.model';
import { ArchiveService } from '../../services/archive.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthorService } from '../../services/author.service';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as CustomValidators  from '../../validators/validators';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { AuthorSelectorDialogComponent } from '../../shared/author-selector-dialog/author-selector-dialog.component';
import { AuthorDetails } from '../../models/author.model';
import { Role } from '../../models/user.model';

@Component({
  selector: 'app-archiveview',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PdfViewerModule],
  templateUrl: './archiveview.component.html',
  styleUrl: './archiveview.component.css'
})
export class ArchiveviewComponent implements OnInit {

  archiveForm: FormGroup;
  archiveData!: ArchiveDetails;
  formSent = false;
  clearedErrors: Set<string> = new Set();
  name: string = '';
  archiveId: string = '';
  editMode = false;
  canEditOrDelete = false;
  usernameCreatedBy: string = '';
  isClient = true;

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar,
    private archiveService: ArchiveService, private authorService: AuthorService, private dialog:MatDialog,
    private activatedRoute: ActivatedRoute, private authService: AuthService, private userService: UserService) {
 
      this.archiveForm = this.formbuilder.group({

        titulo: [ '', [Validators.required, CustomValidators.nameValidator(), CustomValidators.requiredValidator()] ],
        fechaPubli: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.noFutureDateValidator()] ],
        resumen: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator()] ],
        fichero:['',[Validators.required]],
        ficheroMimeType:[''],
        autores:[[], Validators.required]
      });
    
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.archiveId = params['id'];      
      this.archiveService.getArchive(this.archiveId).subscribe(archive => {
        if (archive) {
          console.log(archive);
          this.archiveData = archive;
          this.fillValuesForm(archive);
          console.log(this.archiveForm.value)
          this.name=archive.title;
          this.isClient = this.checkIfClientUser();
          if(!this.isClient){
            this.userService.getUser(archive.userCreatedId).subscribe({
              next:(u) =>{
                archive.usernameCreatedBy = u.name + " " + u.surname;
                this.usernameCreatedBy = archive.usernameCreatedBy;
                this.canEditOrDelete = this.checkIfCanEditOrDelete();
                if(!this.canEditOrDelete) this.editMode=false;
                if(this.editMode) this.habilitarEdicion();
              },
              error: (err) => {
                archive.usernameCreatedBy="Anónimo"
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

  fillValuesForm(archive: ArchiveDetails): void{
    this.archiveForm.patchValue({
      titulo: archive.title,
      fechaPubli: archive.publicationDate,
      fichero: archive.file,
      ficheroMimeType: archive.fileMimeType,
      resumen: archive.summary,
      autores: archive.authorIds ?? []
    });
  }

  onSent():void{
    this.formSent = true;
    this.clearedErrors.clear();

    if(this.archiveForm.valid){
      console.log("válido");
      console.log(this.archiveData)
      console.log('Datos del formulario:', this.archiveForm.value);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirma actualización',
          message: '¿Estás seguro de que quieres actualizar este archivo?.\nEsta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.updateArchive();
        }
      });
    }
    else{
      console.log("no valido");
      this.archiveForm.markAllAsTouched();
    }
  }

  private updateArchive(){
    let updatedArchive = this.mapFormToUpdateArchive();
    console.log("Datos update", updatedArchive)
    this.archiveService.updateArchive(this.archiveId, updatedArchive).subscribe({
      next:() =>{
        console.log("done");
        this.snackBar.open('Se ha actualizado correctamente el archivo.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/archivelist']);
      },
      error: (err) => {
        console.error('Error al actualizar el archivo:', err);
        this.snackBar.open('Error al actualizar el archivo.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    })
  }

  private mapFormToUpdateArchive() {
    const v = this.archiveForm.getRawValue(); 
    let updatedArchive: ArchiveDetails = { ...this.archiveData };
    updatedArchive.usernameCreatedBy = undefined;
        
    if (v.titulo !== this.archiveData.title) updatedArchive.title = v.titulo;
    if (v.resumen !== this.archiveData.summary) updatedArchive.summary = v.resumen;
    if (v.autores !== this.archiveData.authorIds) updatedArchive.authorIds = v.autores;
    if (v.fechaPubli !== this.archiveData.publicationDate) updatedArchive.publicationDate = v.fechaPubli;
    if (v.fichero !== this.archiveData.file){
      updatedArchive.file = v.fichero;
      updatedArchive.fileMimeType = v.ficheroMimeType
    }
    return updatedArchive;
  }

  deleteArchive(): void{
      if(!this.checkIfCanEditOrDelete()){
        this.snackBar.open('No tienes permisos para borrar este archivo', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
      }
      else{
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '350px',
          data: {
            title: '¿Estás seguro?',
            message: 'Vas a eliminar a este archivo del sistema. Esta acción no se puede deshacer.'
          }
        });
  
        dialogRef.afterClosed().subscribe(result => {
          if (result === true) {
            this.archiveService.deleteArchive(this.archiveData.id.toString()).subscribe({
              next:() =>{
                this.snackBar.open('Archivo eliminado', 'Cerrar', {
                  duration: 5000,
                  panelClass: ['snackbar-success']
                });
                this.router.navigate(['/archivelist']);
              },
              error: (err) => {
                console.error('Error al borrar el archivo:', err);
                this.snackBar.open('Error al borrar el archivo', 'Cerrar', {
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
    else if(userId && userId === this.archiveData.userCreatedId) return true;
    else if(userrole && userId && this.archiveData && this.archiveData.usernameCreatedBy && this.archiveData.usernameCreatedBy === "Anónimo") return true;
    else return false;
  }

   onFileSelected(event: any){
    const file = event.target.files[0]
    if (file){
      if(file.type.startsWith('application/')){
        const reader = new FileReader();
        reader.onload =() =>{
          const base64String = (reader.result as string).split(',')[1];
          const mimeType = file.type;

          this.archiveForm.patchValue({
            fichero: base64String,
            ficheroMimeType: mimeType
          })
        };
        reader.readAsDataURL(file);
      }
    }
  }

   deshabilitarEdicion(): void {
    this.editMode = false;
    this.titulo?.clearValidators();
    this.titulo?.updateValueAndValidity();

    this.fechaPubli?.clearValidators();
    this.fechaPubli?.updateValueAndValidity();

    this.fichero?.clearValidators();
    this.fichero?.updateValueAndValidity();

    this.resumen?.clearValidators();
    this.resumen?.updateValueAndValidity();

    this.autores?.clearValidators();
    this.autores?.updateValueAndValidity();
  }

  habilitarEdicion(): void {
    if(this.checkIfCanEditOrDelete()){
      this.editMode = true;

      //Aplicamos los validadores del título
      this.titulo?.setValidators([
        Validators.required, CustomValidators.nameValidator(), CustomValidators.requiredValidator() 
      ]);
      this.titulo?.updateValueAndValidity();

      //Aplicamos los validadores de la fecha de publicación
      this.fechaPubli?.setValidators([
        Validators.required, CustomValidators.requiredValidator(), CustomValidators.noFutureDateValidator()
      ]);
      this.fechaPubli?.updateValueAndValidity();

      //Aplicamos los validadores del fichero
      this.fichero?.setValidators([
        Validators.required, CustomValidators.requiredValidator() 
      ]);
      this.fichero?.updateValueAndValidity();

      //Aplicamos los validadores del resumen
      this.resumen?.setValidators([
        Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator() 
      ]);
      this.resumen?.updateValueAndValidity();

      //Aplicamos los validadores de los autores
      this.autores?.setValidators([
        Validators.required
      ]);
      this.autores?.updateValueAndValidity();
    }
  }

  goBack(){
    console.log("volviendo");
    this.router.navigate(['/archivelist']);

  }
  
  get titulo() {
    return this.archiveForm.get('titulo');
  }
  get fechaPubli() {
    return this.archiveForm.get('fechaPubli')
  }

  get fichero(){
    return this.archiveForm.get('fichero');
  }

  get resumen() {
    return this.archiveForm.get('resumen');
  }

  get autores() {
    return this.archiveForm.get('autores')
  }

}
