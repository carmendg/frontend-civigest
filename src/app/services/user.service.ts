import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams  } from '@angular/common/http';
import { CreateUser, User, UserSearchParams, UserDetailsList, Status } from '../models/user.model';
import { Observable } from 'rxjs';
import { ApiBaseUrls } from '../config/api-endpoints';
import { PagedResponse } from '../models/paged-response.model';
import { SearchFilterDefinition } from '../models/search-filter.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  register(user: CreateUser): Observable<any> {
    return this.http.post(`${ApiBaseUrls.users}`, user);
  }

  getUser(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.get(`${ApiBaseUrls.users}/${id}`, {headers});
  }

  updateUser(id:string, user: User): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.put(`${ApiBaseUrls.users}/${id}`, user, {headers});
  }

  deleteUser(id:string): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.delete(`${ApiBaseUrls.users}/${id}`, {headers});
  }

  getUserList(request: UserSearchParams): Observable<PagedResponse<UserDetailsList>> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });

    let params = new HttpParams() 
      .set('npag', request.npag.toString())
      .set('nelem', request.nelem.toString());

    if (request.nombre) params = params.set('nombre', request.nombre);
    if (request.apellido) params = params.set('apellido', request.apellido);
    if (request.orden) params = params.set('orden', request.orden);
    if (request.campoOrden) params = params.set('campoOrden', request.campoOrden);
    if (request.estado) params = params.set('estado', request.estado);

    return this.http.get<PagedResponse<UserDetailsList>>(`${ApiBaseUrls.users}/`, {headers, params: params });
  }

  getFilterUserList(): SearchFilterDefinition[] {
    let filters: SearchFilterDefinition[] =[
      {//Surname
        id:'surname_search',
        label:'',
        placeholder:'Buscar por apellido...',
        type:'text',
      },
      {//Status
        id:'status_search',
        label:'Estado',
        type:'select',
        options: Object.values(Status),
        placeholder:''
      },
    ];
    return filters;
    
  }


}
