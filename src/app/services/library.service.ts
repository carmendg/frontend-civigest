import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateLibrary, LibraryDetails, LibrarySearchParams } from '../models/library.model';
import { Observable } from 'rxjs';
import { ApiBaseUrls } from '../config/api-endpoints';
import { PagedResponse } from '../models/paged-response.model';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {


  constructor(private http: HttpClient) { }

  create(library: CreateLibrary): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.post(`${ApiBaseUrls.libraries}`, library, {headers});
  }

  getLibrary(id: string): Observable<any> {
    return this.http.get(`${ApiBaseUrls.libraries}/${id}`);
  }

  updateLibrary(id:string, library: LibraryDetails): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.put(`${ApiBaseUrls.libraries}/${id}`, library, {headers});
  }

  deleteLibrary(id:string): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.delete(`${ApiBaseUrls.libraries}/${id}`, {headers});
  }

  getLibraryList(request: LibrarySearchParams): Observable<PagedResponse<LibraryDetails>> {
    
    let params = new HttpParams() 
      .set('npag', request.npag.toString())
      .set('nelem', request.nelem.toString());

    if (request.name) params = params.set('nombre', request.name);
    if (request.orderBy) params = params.set('orden', request.orderBy);
    if (request.orderField) params = params.set('campoOrden', request.orderField);

    return this.http.get<PagedResponse<LibraryDetails>>(`${ApiBaseUrls.libraries}/`, {params: params });
  }

}
