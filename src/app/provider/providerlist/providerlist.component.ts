import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ProviderDetails, ProviderSearchParams } from '../../models/provider.model';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { getSpanishPaginatorIntl } from '../../shared/spanish-paginator-intl';
import { PagedResponse } from '../../models/paged-response.model';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProviderService } from '../../services/provider.service';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { Role } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { MatInputModule } from '@angular/material/input';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';


@Component({
  selector: 'app-providerlist',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatSortModule, MatProgressSpinnerModule, MatInputModule, SearchBarComponent ],
  providers: [ { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() } ], 
  templateUrl: './providerlist.component.html',
  styleUrl: './providerlist.component.css'
})
export class ProviderlistComponent  implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['name', 'contact', 'email', 'address', 'phone', 'username', 'actions'];
  dataSource: ProviderDetails[] = [];
  usernameCache: Map<string, string> = new Map();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  
  searchParams: ProviderSearchParams={
    npag:0,
    nelem:10
  };

  pagedResponse!: PagedResponse<ProviderDetails>;
  loading: boolean = false;
  private lastSortRef: MatSort | null = null;

  constructor(private providerService: ProviderService, private dialog: MatDialog, private authService: AuthService,
              private snackBar: MatSnackBar, private router:Router, private userService: UserService ) {}

  getListProvider(){
    this.loading = true;

    this.providerService.getProviderList(this.searchParams).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        //this.dataSource = response.items;
        this.dataSource.length = 0;
        //loadUsernameProviderGuest()
        this.dataSource.push(...response.items);
        this.dataSource = [...this.dataSource];
        this.loadUsernameProviderGuest(this.dataSource)
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
    this.getListProvider();
    
  }

  ngAfterViewInit(): void {

     this.sort.sortChange.subscribe((sort: Sort) => {
      const fieldMap: Record<string, string> = {
        name: 'nombre',
      };

      const mappedField = fieldMap[sort.active];
      if (!mappedField || !sort.direction) {
        delete this.searchParams.orderField;
        delete this.searchParams.orderBy;
      } else {
        this.searchParams.orderField = mappedField;
        this.searchParams.orderBy = sort.direction;
      }

      // Establecemos la página a la primera cuando cambia el orden
      this.searchParams.npag = 0;
      
      // Llamamos a la función para obtener los usuarios con el nuevo orden
      this.getListProvider();
      
    });
    
  }

  ngAfterViewChecked(): void {
    // Verificamos si `matSort` está disponible
    if (this.sort && this.sort !== this.lastSortRef) {
      this.lastSortRef = this.sort;
      this.sort.sortChange.subscribe((sort: Sort) => {
        const fieldMap: Record<string, string> = {
          name: 'nombre',
        };

        const mappedField = fieldMap[sort.active];
        if (!mappedField || !sort.direction) {
          delete this.searchParams.orderField;
          delete this.searchParams.orderBy;
        } else {
          this.searchParams.orderField = mappedField;
          this.searchParams.orderBy = sort.direction;
        }

        this.searchParams.npag = 0; // Reinicia a la primera página
        this.getListProvider();
      });
    }
  }

  
  onPageChange(event: any): void {
    this.searchParams.nelem = event.pageSize;
    this.searchParams.npag = event.pageIndex;
    
    this.getListProvider(); // Recargar los usuarios con la nueva página
  }

  viewProvider(provider: ProviderDetails): void {
    console.log('Ver proveedor', provider);
    this.router.navigate(['/providerview', provider.id], { queryParams: { edit: false } });
  }

  editProvider(provider: ProviderDetails): void {
    if(!this.checkIfCanEditOrDelete(provider)){
      this.snackBar.open('No tienes permisos para editar a este proveedor', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else
    this.router.navigate(['/providerview', provider.id], { queryParams: { edit: true } });
  }

  deleteProvider(provider: ProviderDetails): void {
    if(!this.checkIfCanEditOrDelete(provider)){
      this.snackBar.open('No tienes permisos para borrar a este proveedor', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else{
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: '¿Estás seguro?',
          message: 'Vas a eliminar a este proveedor del sistema. Esta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.providerService.deleteProvider(provider.id.toString()).subscribe({
            next:() =>{
              this.snackBar.open('Proveedor eliminado', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.getListProvider();
            },
            error: (err) => {
              console.error('Error al borrar el proveedor:', err);
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

  createProvider(): void{
    console.log('crear proveedor');
    this.router.navigate(['/providernew']);

  }

  loadUsernameProviderGuest(providers: ProviderDetails[]){
    providers.forEach(element => {
      this.userService.getUser(element.userCreatedId).subscribe({
        next:(u) =>{
          element.usernameCreatedBy = u.name + " " + u.surname;
        },
        error: (err) => {
          element.usernameCreatedBy="Anónimo"
        }
      });
      
    });
  }

  applyFilter(event: {text:string; filters: {[key:string]:any}}){
    const { text, filters } = event;

    this.searchParams.name = text?.trim().toLowerCase() || '';
    this.searchParams.npag = 0;
    this.getListProvider();
  }

  checkIfCanEditOrDelete(provider: ProviderDetails): boolean{
    const userrole= this.authService.getRoleFromToken();
    const userId = this.authService.getUserIdFromToken();
    if(userrole && userrole === Role.admin) return true;
    else if(userId && userId === provider.userCreatedId) return true;
    else if(provider.usernameCreatedBy && provider.usernameCreatedBy === "Anónimo") return true;
    else return false;
  }


  get totalItems(): number {
    return this.pagedResponse?.totalItems ?? 0;
  }

  get pageSize(): number {
    return this.pagedResponse?.pageSize ?? this.searchParams.nelem;
  }

}
