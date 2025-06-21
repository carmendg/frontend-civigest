import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthorSelectorDialogComponent } from '../../shared/author-selector-dialog/author-selector-dialog.component';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthorService } from '../../services/author.service';
import { ArchiveService } from '../../services/archive.service';
import * as CustomValidators from '../../validators/validators';
import { AuthorDetails } from '../../models/author.model';
import { CreateArchive } from '../../models/archive.model';

@Component({
  selector: 'app-archivenew',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './archivenew.component.html',
  styleUrl: './archivenew.component.css'
})
export class ArchivenewComponent {

  archiveForm: FormGroup;
  formSent = false;
  clearedErrors: Set<string> = new Set();

  constructor(private formbuilder: FormBuilder, private router: Router, private snackBar: MatSnackBar,
    private archiveService: ArchiveService, private authorService: AuthorService, private dialog:MatDialog) {
 
      this.archiveForm = this.formbuilder.group({

        titulo: [ '', [Validators.required, CustomValidators.nameValidator(), CustomValidators.requiredValidator()] ],
        fechaPubli: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.noFutureDateValidator()] ],
        resumen: ['',[Validators.required, CustomValidators.requiredValidator(), CustomValidators.descripcionValidator()] ],
        fichero:['',[Validators.required]],
        ficheroMimeType:[''],
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

    if(this.archiveForm.valid){
      console.log("válido");
      console.log('Datos del formulario:', this.archiveForm.value);
      const newArchive = this.mapFormToCreateArchive();
      console.log(newArchive);
      this.archiveService.create(newArchive).subscribe({
        next: () => {
          console.log("done");
          this.snackBar.open('Archivo creado', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/archivelist']);
        },
        error: (err) => {
          console.error('Error al crear el archivo:', err);
          this.snackBar.open('Error al crear el archivo.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
    else{
      console.log("no valido");
      console.log('Datos del formulario:', this.archiveForm.value);
      this.archiveForm.markAllAsTouched();
    }
  }

  private mapFormToCreateArchive(): CreateArchive {
    const v = this.archiveForm.value;
    return {
      title: v.titulo,
      summary: v.resumen,
      publicationDate: new Date(v.fechaPubli).toISOString().split('T')[0],
      file: v.fichero,
      fileMimeType: v.ficheroMimeType,
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

  get titulo() {
    return this.archiveForm.get('titulo');
  }

  get fechaPubli() {
    return this.archiveForm.get('fechaPubli');
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
