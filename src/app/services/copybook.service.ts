import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CopyBookDetails, CopyBookSearchParams, CopyBookStatus, CreateCopyBook } from '../models/copybook.model';
import { ApiBaseUrls } from '../config/api-endpoints';
import { PagedResponse } from '../models/paged-response.model';
import { SearchFilterDefinition } from '../models/search-filter.model';

@Injectable({
  providedIn: 'root'
})
export class CopybookService {

  constructor(private http: HttpClient) { }

  create(copybook: CreateCopyBook): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.post(`${ApiBaseUrls.copybooks}`, copybook, {headers});
  }

  getCopyBook(id: string): Observable<any> {
    return this.http.get(`${ApiBaseUrls.copybooks}/${id}`);
  }

  updateCopyBook(id:string, copybook: CopyBookDetails): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.put(`${ApiBaseUrls.copybooks}/${id}`, copybook, {headers});
  }

  deleteCopyBook(id:string): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.delete(`${ApiBaseUrls.copybooks}/${id}`, {headers});
  }

  getCopyBookList(request: CopyBookSearchParams): Observable<PagedResponse<CopyBookDetails>> {
    
    let params = new HttpParams() 
      .set('npag', request.npag.toString())
      .set('nelem', request.nelem.toString());

    if (request.book) params = params.set('libro', request.book);
    if (request.library) params = params.set('biblio', request.library);
    if (request.status) params = params.set('estado', request.status);
    if (request.libraryId) params = params.set('biblioId', request.libraryId);
    if (request.bookId) params = params.set('libroId', request.bookId);
    if (request.orderBy) params = params.set('orden', request.orderBy);
    if (request.orderField) params = params.set('campoOrden', request.orderField);

    return this.http.get<PagedResponse<CopyBookDetails>>(`${ApiBaseUrls.copybooks}/`, {params: params });
  }

  getFilterCopyBookList(): SearchFilterDefinition[] {
      let filters: SearchFilterDefinition[] =[
        {//Library name
          id:'library_search',
          label:'',
          placeholder:'Buscar por biblioteca...',
          type:'text',
        },
        /*{//Book title
          id:'book_search',
          label:'',
          type:'text',
          placeholder:'Buscar por título del libro...'
        },*/
        {//Status
          id:'status_search',
          label:'Estado',
          type:'select',
          options: Object.values(CopyBookStatus),
          placeholder:''
        }
      ];
      return filters;
      
    }
}
