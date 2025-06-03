import { Component, OnInit } from '@angular/core';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookDetails, BookSearchParams } from '../../models/book.model';
import { PagedResponse } from '../../models/paged-response.model';
import { BookService } from '../../services/book.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Role } from '../../models/user.model';
import { SearchFilterDefinition } from '../../models/search-filter.model';

@Component({
  selector: 'app-booklist',
  imports: [SearchBarComponent, CommonModule, MatProgressSpinnerModule],
  templateUrl: './booklist.component.html',
  styleUrl: './booklist.component.css'
})
export class BooklistComponent implements OnInit{

  searchParams: BookSearchParams={
    npag:0,
    nelem:3,
    orderBy:'asc',
    orderField:'titulo'
  };

  pagedResponse!: PagedResponse<BookDetails>;
  loading: boolean = false;
  libros: BookDetails[] = [];
  canAdd: boolean = false;
  filters: SearchFilterDefinition[] = [];

  constructor(private bookService: BookService, private dialog: MatDialog, private authService: AuthService,
              private snackBar: MatSnackBar, private router:Router ) {}

  getListBook(){
    this.loading = true;

    this.bookService.getBookList(this.searchParams).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        this.libros.push(...response.items);
        this.canAdd = this.checkIfCanAdd();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  ngOnInit(): void {
    this.filters = this.bookService.getFilterBookList();
    this.getListBook();
  }

  verDetalles(book: BookDetails){
    this.router.navigate(['/bookview', book.id]);
  }

  loadMore(){
    this.searchParams.npag++;
    this.getListBook(); 
  }

  applyFilter(event: {text:string; filters: {[key:string]:any}}){
    const { text, filters } = event;

    this.searchParams.title = text?.trim().toLowerCase() || '';
    this.searchParams.isbn = filters['isbn_search'] || '';
    //this.searchParams.estado = filters['status_search'] || '';
    this.searchParams.npag=0;
    this.libros=[];
    this.getListBook();

  }

  createBook(){
    this.router.navigate(['/booknew']);
  }

  checkIfCanAdd(): boolean{
    const userrole= this.authService.getRoleFromToken();
    if(userrole && userrole === Role.admin) return true;
    if(userrole && userrole === Role.gestor) return true;
    return false;
  }

  getAuthorsList(libro: BookDetails): string{
    return libro.authorIds?.map(b => b.nameSurname).join(', ') || "Anónimo";
  }

}
