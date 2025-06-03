import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BookDetails, BookSearchParams, CreateBook } from '../models/book.model';
import { Observable } from 'rxjs';
import { ApiBaseUrls } from '../config/api-endpoints';
import { PagedResponse } from '../models/paged-response.model';
import { SearchFilterDefinition } from '../models/search-filter.model';

@Injectable({
  providedIn: 'root'
})
export class BookService {

  constructor(private http: HttpClient) { }

  create(book: CreateBook): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.post(`${ApiBaseUrls.books}`, book, {headers});
  }

  getBook(id: string): Observable<any> {
    return this.http.get(`${ApiBaseUrls.books}/${id}`);
  }

  updateBook(id:string, book: BookDetails): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.put(`${ApiBaseUrls.books}/${id}`, book, {headers});
  }

  deleteBook(id:string): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.delete(`${ApiBaseUrls.books}/${id}`, {headers});
  }

  getBookList(request: BookSearchParams): Observable<PagedResponse<BookDetails>> {
    
    let params = new HttpParams() 
      .set('npag', request.npag.toString())
      .set('nelem', request.nelem.toString());

    if (request.title) params = params.set('titulo', request.title);
    if (request.isbn) params = params.set('isbn', request.isbn);
    if (request.publisher) params = params.set('editorial', request.publisher);
    if (request.orderBy) params = params.set('orden', request.orderBy);
    if (request.orderField) params = params.set('campoOrden', request.orderField);

    return this.http.get<PagedResponse<BookDetails>>(`${ApiBaseUrls.books}/`, {params: params });
  }

  getFilterBookList(): SearchFilterDefinition[] {
      let filters: SearchFilterDefinition[] =[
        {//ISBN
          id:'isbn_search',
          label:'',
          placeholder:'Buscar por ISBN...',
          type:'text',
        },
        {//Author
          id:'author_search',
          label:'',
          type:'text',
          placeholder:'Buscar por autor...'
        },
        {//Publisher
          id:'publisher_search',
          label:'',
          type:'text',
          placeholder:'Buscar por editorial...'
        }
      ];
      return filters;
      
    }


}
