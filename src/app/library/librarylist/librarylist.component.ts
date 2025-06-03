import { Component, OnInit } from '@angular/core';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LibraryDetails, LibrarySearchParams } from '../../models/library.model';
import { LibraryService } from '../../services/library.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PagedResponse } from '../../models/paged-response.model';
import { Router } from '@angular/router';
import { Role } from '../../models/user.model';


@Component({
  selector: 'app-librarylist',
  imports: [SearchBarComponent, CommonModule, MatProgressSpinnerModule],
  templateUrl: './librarylist.component.html',
  styleUrl: './librarylist.component.css'
})
export class LibrarylistComponent implements OnInit{

  searchParams: LibrarySearchParams={
      npag:0,
      nelem:3,
      orderBy:'asc',
      orderField:'nombre'
    };

  pagedResponse!: PagedResponse<LibraryDetails>;
  loading: boolean = false;
  bibliotecas: LibraryDetails[] = [];
  canAdd: boolean = false;

  constructor(private libraryService: LibraryService, private dialog: MatDialog, private authService: AuthService,
              private snackBar: MatSnackBar, private router:Router ) {}

  getListLibrary(){
    this.loading = true;

    this.libraryService.getLibraryList(this.searchParams).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        this.bibliotecas.push(...response.items);
        this.canAdd = this.checkIfCanAdd();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
  
  ngOnInit(): void {
    this.getListLibrary();
  }
  
  verDetalles(library: LibraryDetails){
    this.router.navigate(['/libraryview', library.id]);
  }

  loadMore(){
    this.searchParams.npag++;
    this.getListLibrary(); 
  }

  applyFilter(event: {text:string; filters: {[key:string]:any}}){
    const { text, filters } = event;

    this.searchParams.name = text?.trim().toLowerCase() || '';
    this.searchParams.npag = 0;
    this.bibliotecas= [];
    this.getListLibrary();
  }
  createLibrary(){
    this.router.navigate(['/librarynew']);
  }

  checkIfCanAdd(): boolean{
    const userrole= this.authService.getRoleFromToken();
    if(userrole && userrole === Role.admin) return true;
    if(userrole && userrole === Role.gestor) return true;
    return false;
  }
}
