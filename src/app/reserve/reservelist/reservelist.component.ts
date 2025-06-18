import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { getSpanishPaginatorIntl } from '../../shared/spanish-paginator-intl';
import { ReserveDetails, ReserveSearchParams, ReserveStatus } from '../../models/reserve.model';
import { SearchFilterDefinition } from '../../models/search-filter.model';
import { PagedResponse } from '../../models/paged-response.model';
import { ReserveService } from '../../services/reserve.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../services/user.service';
import { LibraryService } from '../../services/library.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Role } from '../../models/user.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-reservelist',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatSortModule, MatProgressSpinnerModule, MatInputModule, SearchBarComponent],
  providers: [ { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() } ],
  templateUrl: './reservelist.component.html',
  styleUrl: './reservelist.component.css'
})
export class ReservelistComponent implements OnInit, AfterViewInit{

  displayedColumns: string[] = [];
  dataSource: ReserveDetails[] = [];
  usernameCache: Map<string, string> = new Map();
  isClient = true;
  isLogged = false;
  title='Listado de reservas';
  libraryName = '';
  filters: SearchFilterDefinition[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  @ViewChild(SearchBarComponent) searchBarComponent!: SearchBarComponent;

  searchParams: ReserveSearchParams={
    npag:0,
    nelem:10
  };

  pagedResponse!: PagedResponse<ReserveDetails>;
  loading: boolean = false;
  private lastSortRef: MatSort | null = null;

  constructor(private reserveService: ReserveService, private dialog: MatDialog, private authService: AuthService,
              private snackBar: MatSnackBar, private router:Router, private userService: UserService,
              private libraryService: LibraryService, private activatedRoute: ActivatedRoute ) {}

  getListReserve(){
    this.loading = true;

    this.reserveService.getReserveList(this.searchParams).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        this.dataSource.length = 0;
        this.dataSource.push(...response.items);
        this.dataSource = [...this.dataSource];
        this.loadUsernameReserveGuest(this.dataSource)
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
    this.filters = this.reserveService.getFilterReserveList();

    if (typeof window !== 'undefined' && window.localStorage) {
      this.authService.userStatus$.subscribe(() => {
        this.isClient = this.checkIfClientUser();
        this.isLogged = this.checkIfIsLogged();
        this.displayedColumns = this.getDisplayedColumns();
      });
      this.isClient = this.checkIfClientUser();
      this.isLogged = this.checkIfIsLogged();
      this.displayedColumns = this.getDisplayedColumns();
    }

    this.activatedRoute.params.subscribe(params => {
      const userIdParam = this.activatedRoute.snapshot.queryParamMap.get('userId');
      const userId = userIdParam !== null ? +userIdParam : NaN;
      if(!isNaN(userId)){
        this.getUserFromParams(userId);
      }
      else {
        const libraryIdParam = this.activatedRoute.snapshot.queryParamMap.get('libraryId');
        const libraryId = libraryIdParam !== null ? +libraryIdParam : NaN;
        if(!isNaN(libraryId)) this.getLibraryFromParams(libraryId);
      }
      this.getListReserve();
    })
      
  }

  getDisplayedColumns(): string[]{
    const base = ['library', 'floor', 'room', 'seat', 'date', 'status', 'actions']
    if(this.isLogged && !this.isClient){
      const index=5;
      this.displayedColumns.splice(index,0,'username')
    }
    return base
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.getDisplayedColumns();
    });
    
     this.sort.sortChange.subscribe((sort: Sort) => {
      const fieldMap: Record<string, string> = {
        date: 'fecha',
        library: 'bilioteca',
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
      this.getListReserve();
      
    });
    
  }

  ngAfterViewChecked(): void {
    // Verificamos si `matSort` está disponible
    if (this.sort && this.sort !== this.lastSortRef) {
      this.lastSortRef = this.sort;
      this.sort.sortChange.subscribe((sort: Sort) => {
        const fieldMap: Record<string, string> = {
        date: 'fecha',
        library: 'bilioteca',
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
        this.getListReserve();
      });
    }
  }

  checkIfClientUser(): boolean{
    const userrole= this.authService.getRoleFromToken();
    if(userrole && (userrole === Role.admin || userrole === Role.gestor)) return false;
    return true;
  }
  
  checkIfIsLogged(): boolean{
    const userid= this.authService.getUserIdFromToken();
    if(userid) return true;
    return false;
  }

  applyFilter(event: {text:string; filters: {[key:string]:any}}){
    const { text, filters } = event;

    this.searchParams.library = text?.trim().toLowerCase() || '';
    this.searchParams.userName = filters['username_search'] || '';
    this.searchParams.status = filters['status_search'] || '';
    this.searchParams.npag=0;
    this.getListReserve();
  }

  getUserFromParams(userId:number){
    //Filtramos por el usuario directamente.
    this.searchParams.userId = userId;
    //Cambiamos el título porque pueden ser sus propias reservas
    this.userService.getUser(userId+'').subscribe({
      next:(u) =>{
        this.title = (this.checkIfClientUser()) ? "Mis resevas" : "Listado de reservas"
        this.searchBarComponent.filters['username_search'] = u.name;
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err);
        this.snackBar.open('Ha ocurrido un error.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        this.router.navigate(['/']);
      }
    });
    
  }

  getLibraryFromParams(libraryId:number){
    //Filtramos por la biblioteca directamente.
    this.searchParams.libraryId = libraryId;
    //Guardamos el nombre para el resto de entradas
    this.libraryService.getLibrary(libraryId+'').subscribe({
      next:(l) =>{
        this.title="Listado de reservas"
        this.libraryName=l.name;
        this.searchBarComponent.searchText = this.libraryName;
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

  loadLibraryName(reserves: ReserveDetails[]){
    reserves.forEach(element => {
      if(this.libraryName){
        element.library = this.libraryName;
      }
      else {
        this.libraryService.getLibrary(element.libraryId+'').subscribe({
          next:(l) =>{
            element.library = l.name;
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
      
    });
  }

  loadUsernameReserveGuest(reserves: ReserveDetails[]){
    reserves.forEach(element => {
      this.userService.getUser(element.userReservedId).subscribe({
        next:(u) =>{
          element.usernameReservedBy= u.name + " " + u.surname;
        },
        error: (err) => {
          element.usernameReservedBy="Anónimo"
        }
      });
      
    });
  }

  onPageChange(event: any): void {
    this.searchParams.nelem = event.pageSize;
    this.searchParams.npag = event.pageIndex;
    
    this.getListReserve();
  }

  createReserve(){
    console.log('Crear reserva');
    //Si tenemos la biblioteca le enviamos ese parámetro
    if(this.libraryName){
      this.router.navigate(['/reservenew'], { queryParams: { libraryId: this.searchParams.libraryId } })
    }
    else this.router.navigate(['/reservenew']);

  }
  viewReserve(reserve: ReserveDetails){
    console.log('Ver resereva', reserve);
    this.router.navigate(['/reserveview', reserve.id], { queryParams: { edit: false } })
  }
  editReserve(reserve: ReserveDetails){
    console.log('Editar reserva',reserve);
    if(!this.checkIfCanEditOrDelete(reserve)){
      this.snackBar.open('No puedes editar esta reserva', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else if(!this.checkValidStatus(reserve)){
      this.snackBar.open('No puedes editar una reserva que ya ha pasado', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    this.router.navigate(['/reserveview', reserve.id], { queryParams: { edit: true } })
  }

  markReserve(reserve: ReserveDetails){
    if(!this.checkValidStatus(reserve)){
      this.snackBar.open('No puedes marcar una reserva que ya se ha actualizado.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else if(!this.checkIfCanEditOrDelete(reserve)){
      this.snackBar.open('No puedes marcar esta reseva', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: '¿Estás seguro?',
          message: 'Vas a marcar que el usuario ' + reserve.usernameReservedBy + ' ha acudido a la reserva. Esta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          reserve.status = ReserveStatus.assists;
          this.reserveService.updateReserve(reserve.id.toString(), reserve).subscribe({
            next:() =>{
              this.snackBar.open('Reserva actualizada', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.getListReserve();
            },
            error: (err) => {
              console.error('Error al actualizar la reserva:', err);
              this.snackBar.open('Error al actualizar la reserva', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          })
        }
      });
    }

  }
  deleteReserve(reserve: ReserveDetails){
    if(!this.checkValidStatus(reserve)){
      this.snackBar.open('No puedes borrar una que ya ha sido marcada.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else if(!this.checkIfCanEditOrDelete(reserve)){
      this.snackBar.open('No puedes eliminar esta reseva', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: '¿Estás seguro?',
          message: 'Vas a eliminar a esta reserva del sistema. Esta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.reserveService.deleteReserve(reserve.id.toString()).subscribe({
            next:() =>{
              this.snackBar.open('Reserva eliminada', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.getListReserve();
            },
            error: (err) => {
              console.error('Error al borrar la reserva:', err);
              this.snackBar.open('Error al borrar la reserva', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          })
        }
      });
    }

  }

  checkIfCanEditOrDelete(reserve: ReserveDetails): boolean{
    if(this.isLogged){
      const userrole= this.authService.getRoleFromToken();
      const userId = this.authService.getUserIdFromToken();
      let today = new Date();
      let reserveDate = new Date(reserve.reserveDate);
      today.setHours(0,0,0,0);
      reserveDate.setHours(0,0,0,0);
      const isFutureDate = reserveDate > today;

      if(userrole && (userrole === Role.admin || userrole === Role.gestor)) return true;
      else if(userId && userId === reserve.userReservedId && isFutureDate) return true;
      else return false;
    }
    else return false;
  }

  checkValidStatus(reserve:ReserveDetails): boolean{
    return reserve.status !== '';
  }

  get totalItems(): number {
    return this.pagedResponse?.totalItems ?? 0;
  }

  get pageSize(): number {
    return this.pagedResponse?.pageSize ?? this.searchParams.nelem;
  }

}
