import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { CommonModule } from '@angular/common';
import { getSpanishPaginatorIntl } from '../../shared/spanish-paginator-intl';
import { CopyBookDetails, CopyBookSearchParams, CopyBookStatus } from '../../models/copybook.model';
import { PagedResponse } from '../../models/paged-response.model';
import { CopybookService } from '../../services/copybook.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Role } from '../../models/user.model';
import { BookService } from '../../services/book.service';
import { LibraryService } from '../../services/library.service';
import { HttpParams } from '@angular/common/http';
import { SearchFilterDefinition } from '../../models/search-filter.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-copybooklist',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatSortModule, MatProgressSpinnerModule, MatInputModule, SearchBarComponent],
  providers: [ { provide: MatPaginatorIntl, useValue: getSpanishPaginatorIntl() } ],
  templateUrl: './copybooklist.component.html',
  styleUrl: './copybooklist.component.css'
})
export class CopybooklistComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [];
  dataSource: CopyBookDetails[] = [];
  usernameCache: Map<string, string> = new Map();
  isClient = true;
  isLogged = false;
  libraryName ='';
  bookTitle ='';
  filters: SearchFilterDefinition[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  @ViewChild(SearchBarComponent) searchBarComponent!: SearchBarComponent;
  
  searchParams: CopyBookSearchParams={
    npag:0,
    nelem:10
  };

  pagedResponse!: PagedResponse<CopyBookDetails>;
  loading: boolean = false;
  private lastSortRef: MatSort | null = null;

  constructor(private copybookService: CopybookService, private dialog: MatDialog, private authService: AuthService,
              private snackBar: MatSnackBar, private router:Router, private userService: UserService,
              private bookService: BookService, private libraryService: LibraryService, private activatedRoute: ActivatedRoute ) {}

  getListCopyBook(){
    this.loading = true;

    this.copybookService.getCopyBookList(this.searchParams).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        this.dataSource.length = 0;
        this.dataSource.push(...response.items);
        this.dataSource = [...this.dataSource];
        this.loadUsernameCopyBookGuest(this.dataSource)
        this.loadBookTitle(this.dataSource);
        this.loadLibraryName(this.dataSource);
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
    this.filters = this.copybookService.getFilterCopyBookList();

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
      const bookIdParam = this.activatedRoute.snapshot.queryParamMap.get('bookId');
      const bookId = bookIdParam !== null ? +bookIdParam : NaN;
      if(!isNaN(bookId)){
        this.getBookFromParams(bookId);
      }
      else {
        const libraryIdParam = this.activatedRoute.snapshot.queryParamMap.get('libraryId');
        const libraryId = libraryIdParam !== null ? +libraryIdParam : NaN;
        if(!isNaN(libraryId)) this.getLibraryFromParams(libraryId);
      }
      this.getListCopyBook();
    })
      
  }

  getDisplayedColumns(): string[]{
    const base = ['title', 'library', 'status', 'ubication', 'editionNum', 'actions']
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
        status: 'estado',
        library: 'bilioteca',
        title: 'titulo'
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
      this.getListCopyBook();
      
    });
    
  }

  ngAfterViewChecked(): void {
    // Verificamos si `matSort` está disponible
    if (this.sort && this.sort !== this.lastSortRef) {
      this.lastSortRef = this.sort;
      this.sort.sortChange.subscribe((sort: Sort) => {
        const fieldMap: Record<string, string> = {
        status: 'estado',
        library: 'bilioteca',
        title: 'titulo'
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
        this.getListCopyBook();
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

    this.searchParams.book = text?.trim().toLowerCase() || '';
    this.searchParams.library = filters['library_search'] || '';
    this.searchParams.status = filters['status_search'] || '';
    this.searchParams.npag=0;
    this.getListCopyBook();
  }

  getBookFromParams(bookId:number){
    //Filtramos por el libro directamente.
    this.searchParams.bookId = bookId;
    //Guardamos el título para el resto de entradas
    this.bookService.getBook(bookId+'').subscribe({
      next:(b) =>{
        this.bookTitle=b.title;
        this.searchBarComponent.searchText = this.bookTitle;

      },
      error: (err) => {
        console.error('Error al obtener libro:', err);
        this.snackBar.open('Ha ocurrido un error.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        this.router.navigate(['/']);
      }
    });
    
  }

  getLibraryFromParams(libraryId:number){
    //Filtramos por el libro directamente.
    this.searchParams.libraryId = libraryId;
    //Guardamos el título para el resto de entradas
    this.libraryService.getLibrary(libraryId+'').subscribe({
      next:(l) =>{
        this.libraryName=l.name;
        this.searchBarComponent.filters['library_search'] = this.libraryName;
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

  loadBookTitle(copybooks: CopyBookDetails[]){
    copybooks.forEach(element => {
      if(this.bookTitle){
        element.bookTitle = this.bookTitle;
      }
      else {
        this.bookService.getBook(element.bookId+'').subscribe({
          next:(b) =>{
            element.bookTitle = b.title;
          },
          error: (err) => {
            console.error('Error al obtener libro:', err);
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

  loadLibraryName(copybooks: CopyBookDetails[]){
    copybooks.forEach(element => {
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

  loadUsernameCopyBookGuest(copybooks: CopyBookDetails[]){
    copybooks.forEach(element => {
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

  onPageChange(event: any): void {
    this.searchParams.nelem = event.pageSize;
    this.searchParams.npag = event.pageIndex;
    
    this.getListCopyBook();
  }

  createCopybook(){
    console.log('Crear ejemplar');
    //Si tenemos la librería o el libro seleccionado le enviamos esos parámetros
    if(this.bookTitle){
      this.router.navigate(['/copybooknew'], { queryParams: { bookId: this.searchParams.bookId } })
    }
    else if(this.libraryName){
      this.router.navigate(['/copybooknew'], { queryParams: { libraryId: this.searchParams.libraryId } })
    }
    else this.router.navigate(['/copybooknew']);

  }
  viewCopybook(copybook: CopyBookDetails){
    console.log('Ver ejemplar', copybook);
    this.router.navigate(['/copybookview', copybook.id], { queryParams: { edit: false } })

  }
  reserveCopyBook(copybook: CopyBookDetails){
    console.log('Reservar ejemplar', copybook)

  }
  editCopybook(copybook: CopyBookDetails){
    console.log('Editar ejemplar',copybook);
    if(!this.checkIfCanEditOrDeleteUser(copybook)){
      this.snackBar.open('No tienes permisos para editar este ejemplar', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else if(!this.checkIfCanEditDeleteOrReserve(copybook)){
      this.snackBar.open('No puedes editar este ejemplar no esta disponible', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    this.router.navigate(['/copybookview', copybook.id], { queryParams: { edit: true } })

  }
  deleteCopybook(copybook: CopyBookDetails){
    if(copybook.status === CopyBookStatus.booked){
      this.snackBar.open('No puedes borrar este ejemplar. Está reservado', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
    else if(!this.checkIfCanEditOrDeleteUser(copybook)){
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
          this.copybookService.deleteCopyBook(copybook.id.toString()).subscribe({
            next:() =>{
              this.snackBar.open('Ejemplar eliminado', 'Cerrar', {
                duration: 5000,
                panelClass: ['snackbar-success']
              });
              this.getListCopyBook();
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

  checkIfCanEditOrDeleteUser(copybook: CopyBookDetails): boolean{
    if(this.isLogged){
      const userrole= this.authService.getRoleFromToken();
      const userId = this.authService.getUserIdFromToken();
      if(userrole && userrole === Role.admin) return true;
      else if(userId && userId === copybook.userCreatedId) return true;
      else if(copybook.usernameCreatedBy && copybook.usernameCreatedBy === "Anónimo") return true;
      else return false;
    }
    else return false;
  }

  checkIfCanEditDeleteOrReserve(copybook:CopyBookDetails): boolean{
    if(this.isLogged){
       return copybook.status === CopyBookStatus.available;
    }
    else return false;
  }

  get totalItems(): number {
    return this.pagedResponse?.totalItems ?? 0;
  }

  get pageSize(): number {
    return this.pagedResponse?.pageSize ?? this.searchParams.nelem;
  }







}
