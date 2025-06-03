import { Component,Inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {

  title: string = 'Confirmación';
  message: string = '¿Quieres continuar con la operación?'

  constructor (public dialog: MatDialogRef<ConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }){
    this.title = data.title;
    this.message = data.message;
  }

  onConfirm(): void {
    this.dialog.close(true);
  }

  onCancel(): void{
    this.dialog.close(false);
  }

}
