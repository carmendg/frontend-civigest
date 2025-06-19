import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { getSpanishPaginatorIntl } from '../../shared/spanish-paginator-intl';
import { SeatService } from '../../services/seat.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { LibraryService } from '../../services/library.service';
import { SeatDetails, SeatSearchParams, SeatStatus } from '../../models/seat.model';
import { PagedResponse } from '../../models/paged-response.model';
import { SearchFilterDefinition } from '../../models/search-filter.model';
import { Role } from '../../models/user.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-seatlist',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatSortModule, MatProgressSpinnerModule, MatInputModule, SearchBarComponent],
  providers: [{provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl()}],
  templateUrl: './seatlist.component.html',
  styleUrl: './seatlist.component.css'
})
export class SeatlistComponent implements OnInit, AfterViewInit{

  displayedColumns: string[] = [];
  dataSource: SeatDetails[] = [];
  filters: SearchFilterDefinition[] = [];
  usernameCache: Map<string, string> = new Map();
  libraryName='';
  isClient = true;
  isLogged = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  @ViewChild(SearchBarComponent) searchBarComponent!: SearchBarComponent;
  
  searchParams: SeatSearchParams={
    npag:0,
    nelem:10,
  };

  pagedResponse!: PagedResponse<SeatDetails>;
  loading: boolean = false;
  private lastSortRef: MatSort | null = null;

  constructor(private seatService: SeatService, private dialog:MatDialog, private authService: AuthService, private router:Router,
              private snackBar: MatSnackBar, private userService: UserService, private libraryService: LibraryService,
              private activatedRoute: ActivatedRoute) {}
  
  ngOnInit(): void {

    this.filters = this.seatService.getFilterSeatList();
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
      console.log(params);
      const libraryIdParam = this.activatedRoute.snapshot.queryParamMap.get('libraryId');
      const libraryId = libraryIdParam !== null ? +libraryIdParam : NaN;
      if(!isNaN(libraryId)) this.getLibraryFromParams(libraryId);
      
      this.getListSeat();
    })
    
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

  getDisplayedColumns(): string[]{
    const base =['library', 'floor', 'room', 'seatNum', 'status', 'actions']
    if(this.isLogged && !this.isClient){
      const index=5;
      this.displayedColumns.splice(index,0,'username')
    }
    return base
  }

  applyFilter(event: {text:string; filters: {[key:string]:any}}){
    const { text, filters } = event;

    this.searchParams.library = text?.trim().toLowerCase() || '';
    
    this.searchParams.floorNum = filters['floor_search'] || '';
    this.searchParams.roomNum = filters['room_search'] || '';
    
    this.searchParams.status = filters['status_search'] || '';
    this.searchParams.hasSocket = this.getSocketValue(filters);
    this.searchParams.hasWindow = this.getWindowsValue(filters);
    this.searchParams.isWCNear = this.getWCValue(filters);

    this.searchParams.npag = 0;
    this.getListSeat();
  }

  getWindowsValue(filters: {[key:string]:any}){
    if(filters['windows_search']){
      return filters['windows_search'] === 'Con ventana'
    }
    else return undefined;
  }

  getSocketValue(filters: {[key:string]:any}){
    if(filters['socket_search']){
      return filters['socket_search'] === 'Con enchufe'
    }
    else return undefined;
  }

  getWCValue(filters: {[key:string]:any}){
    if(filters['wc_search']){
      return filters['wc_search'] === 'Baño cerca'
    }
    else return undefined;
  }

  getListSeat(){
    this.loading = true;

    this.seatService.getSeatList(this.searchParams).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        this.dataSource.length = 0;
        this.dataSource.push(...response.items);
        this.dataSource = [...this.dataSource];
        this.loadLibraryName(this.dataSource);
        this.loadUsernameSeatGuest(this.dataSource);
        console.log(this.dataSource);
        this.loading = false;

        if (this.paginator) {
          this.paginator.length = response.totalItems;
        }
        console.log(this.searchParams)
      },
      error: () => {
        this.loading = false;
      }
    })
  }

  getLibraryFromParams(libraryId:number){
    this.searchParams.libraryId = libraryId;
    this.libraryService.getLibrary(libraryId+'').subscribe({
      next:(l) =>{
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

  loadLibraryName(seat: SeatDetails[]){
    seat.forEach(element => {
      if(this.libraryName){
        element.libraryName = this.libraryName;
      }
      else {
        this.libraryService.getLibrary(element.libraryId+'').subscribe({
          next:(l) =>{
            element.libraryName = l.name;
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

  loadUsernameSeatGuest(seat: SeatDetails[]){
    seat.forEach(element => {
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

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.getDisplayedColumns();
    });

    this.sort.sortChange.subscribe((sort: Sort) => {
      const fieldMap: Record<string, string> = {
        status: 'estado',
        library: 'biblioteca',
        floor: 'planta',
        room: 'sala'
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
      this.getListSeat();
      
    });
    
  }

  ngAfterViewChecked(): void {
    // Verificamos si `matSort` está disponible
    if (this.sort && this.sort !== this.lastSortRef) {
      this.lastSortRef = this.sort;
      this.sort.sortChange.subscribe((sort: Sort) => {
        const fieldMap: Record<string, string> = {
          library: 'biblioteca',
          floor: 'planta',
          room: 'sala'
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
        this.getListSeat();
      });
    }
  }

  onPageChange(event: any): void {
    this.searchParams.nelem = event.pageSize;
    this.searchParams.npag = event.pageIndex;
    
    this.getListSeat();
  }

  createSeat(){
    if(this.libraryName){
      this.router.navigate(['/seatnew'], { queryParams: { libraryId: this.searchParams.libraryId } })
    }
    else this.router.navigate(['/seatnew']);
  }

  viewSeat(seat: SeatDetails): void {
    this.router.navigate(['/seatview', seat.id], { queryParams: { edit: false } });
  }

  editSeat(seat: SeatDetails): void {
    if(!this.checkIfCanEditOrDeleteUser(seat)){
      this.snackBar.open('No tienes permisos para editar este asiento', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else if(!this.checkIfCanEditDeleteStatus(seat)){
      this.snackBar.open('No puedes editar este asiento no esta disponible', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    this.router.navigate(['/seatview', seat.id], { queryParams: { edit: true } })
  }

  deleteSeat(seat: SeatDetails){
    if(seat.status === SeatStatus.reserved){
      this.snackBar.open('No puedes borrar este asiento. Está reservado', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else if(!this.checkIfCanEditOrDeleteUser(seat)){
      this.snackBar.open('No tienes permisos para eliminar este asiento', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: '¿Estás seguro?',
          message: 'Vas a eliminar a este asiento del sistema. Esta acción no se puede deshacer.'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.seatService.deleteSeat(seat.id.toString()).subscribe({
            next:() =>{
              this.snackBar.open('Asiento eliminado', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.getListSeat();
            },
            error: (err) => {
              console.error('Error al borrar el asiento:', err);
              this.snackBar.open('Error al borrar el asiento', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          })
        }
      });
    }

  }

  reserveSeat(seat:SeatDetails): void{
    this.router.navigate(['/reservenew'], { queryParams: { libraryId: seat.libraryId } })

  }

  checkIfCanEditOrDeleteUser(seat: SeatDetails): boolean{
    const userrole= this.authService.getRoleFromToken();
    const userId = this.authService.getUserIdFromToken();
    if(userrole && userrole === Role.admin) return true;
    else if(userrole && userrole === Role.cliente) return false;
    else if(userId && userId === seat.userCreatedId) return true;
    else if(seat.usernameCreatedBy && seat.usernameCreatedBy === "Anónimo") return true;
    else return false;
  }
  
  checkIfCanEditDeleteStatus(seat:SeatDetails): boolean{
    return seat.status === SeatStatus.available ||
            seat.status === SeatStatus.damaged;
  }

  get totalItems(): number {
    return this.pagedResponse?.totalItems ?? 0;
  }

  get pageSize(): number {
    return this.pagedResponse?.pageSize ?? this.searchParams.nelem;
  }

}
