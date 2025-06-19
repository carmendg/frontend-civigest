import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseUrls } from '../config/api-endpoints';
import { CreateReserve, ReserveDetails, ReserveSearchParams, ReserveStatus } from '../models/reserve.model';
import { PagedResponse } from '../models/paged-response.model';
import { SearchFilterDefinition } from '../models/search-filter.model';

@Injectable({
  providedIn: 'root'
})
export class ReserveService {

  constructor(private http: HttpClient) { }

   create(reserve: CreateReserve): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.post(`${ApiBaseUrls.reserves}`, reserve, {headers});
  }

  getReserve(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.get(`${ApiBaseUrls.reserves}/${id}`, {headers});
  }

  updateReserve(id:string, reserve: ReserveDetails): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.put(`${ApiBaseUrls.reserves}/${id}`, reserve, {headers});
  }

  deleteReserve(id:string): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.delete(`${ApiBaseUrls.reserves}/${id}`, {headers});
  }

  getReserveList(request: ReserveSearchParams): Observable<PagedResponse<ReserveDetails>> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    
    let params = new HttpParams() 
      .set('npag', request.npag.toString())
      .set('nelem', request.nelem.toString());

    if (request.libraryId) params = params.set('biblioId', request.libraryId);
    if (request.status) params = params.set('estado', request.status);
    if (request.userId) params = params.set('userId', request.userId);
    if (request.userName) params = params.set('usuario', request.userName);
    if (request.library) params = params.set('biblio', request.library);
    if (request.floor) params = params.set('planta', request.floor);
    if (request.reserveDate) params = params.set('fecha', request.reserveDate);

    if (request.orderBy) params = params.set('orden', request.orderBy);
    if (request.orderField) params = params.set('campoOrden', request.orderField);

    return this.http.get<PagedResponse<ReserveDetails>>(`${ApiBaseUrls.reserves}/`, {params: params, headers:headers });
  }

  getFilterReserveList(): SearchFilterDefinition[] {
      let filters: SearchFilterDefinition[] =[
        {//Status
          id:'status_search',
          label:'Estado',
          type:'select',
          options: Object.values(ReserveStatus),
          placeholder:''
        },
        {//UserName
          id:'username_search',
          label:'',
          placeholder:'Buscar por nombre de usuario...',
          type:'text',
        }
      ];
      return filters;
      
    }


}
