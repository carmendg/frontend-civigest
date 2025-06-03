import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseUrls } from '../config/api-endpoints';
import { PagedResponse } from '../models/paged-response.model';
import { CreateProvider, ProviderDetails, ProviderSearchParams } from '../models/provider.model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {

  constructor(private http: HttpClient, private userService: UserService) { }

  create(provider: CreateProvider): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.post(`${ApiBaseUrls.providers}`, provider, {headers});
  }

  getProvider(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.get(`${ApiBaseUrls.providers}/${id}`, {headers});
  }

  updateProvider(id:string, provider: ProviderDetails): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.put(`${ApiBaseUrls.providers}/${id}`, provider, {headers});
  }

  deleteProvider(id:string): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.delete(`${ApiBaseUrls.providers}/${id}`, {headers});
  }

  getProviderList(request: ProviderSearchParams): Observable<PagedResponse<ProviderDetails>> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });

    let params = new HttpParams() 
      .set('npag', request.npag.toString())
      .set('nelem', request.nelem.toString());

    if (request.name) params = params.set('nombre', request.name);
    if (request.orderBy) params = params.set('orden', request.orderBy);
    if (request.orderField) params = params.set('campoOrden', request.orderField);

    return this.http.get<PagedResponse<ProviderDetails>>(`${ApiBaseUrls.providers}/`, {headers, params: params });
  }

}
