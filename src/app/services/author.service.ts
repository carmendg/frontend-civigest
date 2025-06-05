import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseUrls } from '../config/api-endpoints';
import { AuthorDetails, AuthorSearchParams } from '../models/author.model';
import { PagedResponse } from '../models/paged-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthorService {

  constructor(private http: HttpClient) { }

  create(author: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    const params = new HttpParams().set('authorName', author);
    return this.http.post(`${ApiBaseUrls.authors}`, null, {headers, params});
  }

  getAuthor(id: string): Observable<any> {
    return this.http.get(`${ApiBaseUrls.authors}/${id}`);
  }

  getAuthorList(request: AuthorSearchParams): Observable<PagedResponse<AuthorDetails>> {
    
    let params = new HttpParams() 
      .set('npag', request.npag.toString())
      .set('nelem', request.nelem.toString());

    if (request.name) params = params.set('nombre', request.name);
    if (request.orderBy) params = params.set('orden', request.orderBy);
    if (request.orderField) params = params.set('campoOrden', request.orderField);

    return this.http.get<PagedResponse<AuthorDetails>>(`${ApiBaseUrls.authors}/`, {params: params });
  }

  deleteAuthor(id:string): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.delete(`${ApiBaseUrls.authors}/${id}`, {headers});
  }

  updateAuthor(id:string, author:AuthorDetails):Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.put(`${ApiBaseUrls.authors}/${id}`, author, {headers});
  }




}
