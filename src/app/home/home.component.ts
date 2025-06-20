import { Component, OnInit, HostListener  } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { BookService } from '../services/book.service';
import { Router, RouterModule } from '@angular/router';
import { LibraryService } from '../services/library.service';
import { LibraryDetails, LibrarySearchParams } from '../models/library.model';
import { BookDetails, BookSearchParams } from '../models/book.model';
import { AuthService } from '../services/auth.service';
import { ArchiveService } from '../services/archive.service';
import { ArchiveDetails, ArchiveSearchParams } from '../models/archive.model';
declare var bootstrap: any;

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})


export class HomeComponent implements OnInit{
  title = 'Bienvenido a CiviGest';

  libros: BookDetails[] = [];
  maxBooks: number = 6;
  maxLibrary: number = 3;
  maxArchives: number = 6;
  bibliotecas: LibraryDetails[] =[];
  archivos: ArchiveDetails[]=[];
  isLogged: boolean = false;

  constructor(private bookService: BookService, private libraryService: LibraryService, private router: Router, 
              private authService: AuthService, private archiveService: ArchiveService) { }

  ngOnInit(): void {
    // Obtener los libros desde el servicio
    this.getListBook();

    this.getListLibrary();

    this.getListArchive();

    this.isLogged = this.checkIfIsLogged();

    if (typeof window !== 'undefined') {
      this.updateMaxElements(window.innerWidth);
    }

    setTimeout(() => {
      if(typeof window !== 'undefined'){
        const element = document.getElementById('carrusel');
        if (element) {
          new bootstrap.Carousel(element, {
            interval: 5000,
            ride: 'carousel',
            pause: false
          });
        }
      }
    }, 0);

  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (typeof window !== 'undefined') {
      this.updateMaxElements(event.target.innerWidth);
    }
  }

  checkIfIsLogged(): boolean{
    const userid= this.authService.getUserIdFromToken();
    if(userid) return true;
    return false;
  }

  updateMaxElements(width: number) {
    if (width < 576) {
      this.maxBooks = 1;
      this.maxLibrary = 1;
      this.maxArchives = 1;
    } else if (width < 768) {
      this.maxBooks = 2;
      this.maxLibrary = 2;
      this.maxArchives = 2;
    } else if (width < 992) {
      this.maxBooks = 3;
      this.maxLibrary = 3;
      this.maxArchives = 3;
    } else if (width < 1200) {
      this.maxBooks = 4;
      this.maxLibrary = 3;
      this.maxArchives = 4
    } else {
      this.maxBooks = 6;
      this.maxLibrary = 3;
      this.maxArchives = 6;
    }
  }
  
  getListLibrary(){

    const searchParams: LibrarySearchParams={
      npag:0,
      nelem:3,
      orderBy:'asc',
      orderField:'nombre'
    };

    this.libraryService.getLibraryList(searchParams).subscribe({
      next: (response) => {
        this.bibliotecas.push(...response.items);
      },
      error: (err) => {
        console.error("Error al lanzar petición", err)
      },
    });
  }

  getListArchive(){
    if(this.isLogged){
      const searchParams: ArchiveSearchParams={
        npag:0,
        nelem:6,
        orderBy:'asc',
        orderField:'fecha'
      };

      this.archiveService.getArchiveList(searchParams).subscribe({
        next: (response) => {
          this.archivos.push(...response.items);
        },
        error: (err) => {
          console.error("Error al lanzar petición", err)
        },
      });
    }
  }

  getListBook(){
    const searchParams: BookSearchParams={
      npag:0,
      nelem:6,
      orderBy:'asc',
      orderField:'title'
    };

    this.bookService.getBookList(searchParams).subscribe({
      next: (response) => {
        this.libros.push(...response.items);
      },
      error: (err) => {
        console.error("Error al lanzar petición", err)
      },
    });
  }

  verDetallesBiblio(library: LibraryDetails){
    this.router.navigate(['/libraryview', library.id]);
  }
  verDetallesLibro(book: BookDetails){
    this.router.navigate(['/bookview', book.id]);
  }
  verDetallesArchivo(archive: ArchiveDetails){
    this.router.navigate(['/archiveview', archive.id]);
  }

}
