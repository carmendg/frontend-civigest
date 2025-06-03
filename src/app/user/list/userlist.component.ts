import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { UserDetailsList, UserSearchParams } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { PagedResponse } from '../../models/paged-response.model';
import { getSpanishPaginatorIntl } from '../../shared/spanish-paginator-intl';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { SearchFilterDefinition } from '../../models/search-filter.model';
import { filter } from 'rxjs';


@Component({
  selector: 'app-userlist',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatSortModule, MatProgressSpinnerModule, SearchBarComponent ],
  providers: [ { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() } ], 
  templateUrl: './userlist.component.html',
  styleUrl: './userlist.component.css'
})

export class UserlistComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['name', 'surname', 'email', 'role', 'status', 'actions'];
  dataSource: UserDetailsList[] = [];
  filters: SearchFilterDefinition[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  
  searchParams: UserSearchParams={
    npag:0,
    nelem:10
  };

  pagedResponse!: PagedResponse<UserDetailsList>;
  loading: boolean = false;
  private lastSortRef: MatSort | null = null;

  constructor(private userService: UserService, private dialog: MatDialog, private authService: AuthService,
              private snackBar: MatSnackBar, private router:Router ) {}

  getListUser(){
    this.loading = true;

    this.userService.getUserList(this.searchParams).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        //this.dataSource = response.items;
        this.dataSource.length = 0;
        this.dataSource.push(...response.items);
        this.dataSource = [...this.dataSource];
        console.log(this.dataSource);
        this.loading = false;

        if (this.paginator) {
          this.paginator.length = response.totalItems;
        }
        console.log(this.searchParams);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  ngOnInit(): void {
    this.filters = this.userService.getFilterUserList();
    this.getListUser();
  }

  ngAfterViewInit(): void {

     this.sort.sortChange.subscribe((sort: Sort) => {
      const fieldMap: Record<string, string> = {
        name: 'nombre',
        surname: 'apell'
      };

      const mappedField = fieldMap[sort.active];
      if (!mappedField || !sort.direction) {
        delete this.searchParams.campoOrden;
        delete this.searchParams.orden;
      } else {
        this.searchParams.campoOrden = mappedField;
        this.searchParams.orden = sort.direction;
      }

      // Establecemos la página a la primera cuando cambia el orden
      this.searchParams.npag = 0;
      
      // Llamamos a la función para obtener los usuarios con el nuevo orden
      this.getListUser();
      
    });
    
  }

  ngAfterViewChecked(): void {
    // Verificamos si `matSort` está disponible
    if (this.sort && this.sort !== this.lastSortRef) {
      this.lastSortRef = this.sort;
      this.sort.sortChange.subscribe((sort: Sort) => {
        const fieldMap: Record<string, string> = {
          name: 'nombre',
          surname: 'apell'
        };

        const mappedField = fieldMap[sort.active];
        if (!mappedField || !sort.direction) {
          delete this.searchParams.campoOrden;
          delete this.searchParams.orden;
        } else {
          this.searchParams.campoOrden = mappedField;
          this.searchParams.orden = sort.direction;
        }

        this.searchParams.npag = 0; // Reinicia a la primera página
        this.getListUser();
      });
    }
  }

  
  onPageChange(event: any): void {
    this.searchParams.nelem = event.pageSize;
    this.searchParams.npag = event.pageIndex;
    
    this.getListUser(); // Recargar los usuarios con la nueva página
  }

  viewUser(user: UserDetailsList): void {
    console.log('Ver usuario', user);
    this.router.navigate(['/userview', user.id], { queryParams: { edit: false } });
  }

  editUser(user: UserDetailsList): void {
    console.log('Editar usuario', user);
    this.router.navigate(['/userview', user.id], { queryParams: { edit: true } });
  }

  deleteUser(user: UserDetailsList): void {
    const userId= this.authService.getUserIdFromToken();
    if(userId && userId === user.id.toString()){
      this.snackBar.open('No te puedes eliminar a ti mismo desde aquí.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
      this.router.navigate(['/profile']);
    }
    else{
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: '¿Estás seguro?',
          message: 'Vas a eliminar a este usuario del sistema. Esta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.userService.deleteUser(user.id.toString()).subscribe({
            next:() =>{
              this.snackBar.open('Cuenta eliminada', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.getListUser();
            },
            error: (err) => {
              console.error('Error al borrar la cuenta:', err);
              this.snackBar.open('Error al borrar la cuenta', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          })
        }
      });
    }
  }

  
  applyFilter(event: {text:string; filters: {[key:string]:any}}){
    const { text, filters } = event;

    this.searchParams.nombre = text?.trim().toLowerCase() || '';
    this.searchParams.apellido = filters['surname_search'] || '';
    this.searchParams.estado = filters['status_search'] || '';
    this.searchParams.npag=0;
    this.getListUser();

  }

  get totalItems(): number {
    return this.pagedResponse?.totalItems ?? 0;
  }

  get pageSize(): number {
    return this.pagedResponse?.pageSize ?? this.searchParams.nelem;
  }


}
