import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateSeat, SeatDetails, SeatSearchParams, SeatStatus } from '../models/seat.model';
import { Observable } from 'rxjs';
import { ApiBaseUrls } from '../config/api-endpoints';
import { PagedResponse } from '../models/paged-response.model';
import { SearchFilterDefinition } from '../models/search-filter.model';

@Injectable({
  providedIn: 'root'
})
export class SeatService {

  constructor(private http: HttpClient) { }

   create(seat: CreateSeat): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.post(`${ApiBaseUrls.seats}`, seat, {headers});
  }

  getSeat(id: string): Observable<any> {
    return this.http.get(`${ApiBaseUrls.seats}/${id}`);
  }

  updateSeat(id:string, seat: SeatDetails): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.put(`${ApiBaseUrls.seats}/${id}`, seat, {headers});
  }

  deleteSeat(id:string): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.delete(`${ApiBaseUrls.seats}/${id}`, {headers});
  }

  getSeatList(request: SeatSearchParams): Observable<PagedResponse<SeatDetails>> {
    
    let params = new HttpParams() 
      .set('npag', request.npag.toString())
      .set('nelem', request.nelem.toString());

    if (request.libraryId) params = params.set('biblioId', request.libraryId);
    if (request.status) params = params.set('estado', request.status);
    if (request.hasWindow) params = params.set('hayVentana', request.hasWindow);
    if (request.floorNum) params = params.set('plantaNum', request.floorNum);
    if (request.roomNum) params = params.set('salaNum', request.roomNum);
    if (request.isWCNear) params = params.set('wcCerca', request.isWCNear);
    if (request.hasSocket) params = params.set('hayEnchufe', request.hasSocket);
    if (request.library) params = params.set('biblio', request.library);

    if (request.orderBy) params = params.set('orden', request.orderBy);
    if (request.orderField) params = params.set('campoOrden', request.orderField);

    return this.http.get<PagedResponse<SeatDetails>>(`${ApiBaseUrls.seats}/`, {params: params });
  }

  getFilterSeatList(): SearchFilterDefinition[] {
      let filters: SearchFilterDefinition[] =[
        {//Status
          id:'status_search',
          label:'Estado',
          type:'select',
          options: Object.values(SeatStatus),
          placeholder:''
        },
        {//Floor
          id:'floor_search',
          label:'',
          placeholder:'Buscar por planta...',
          type:'text',
        },
        {//Room
          id:'room_search',
          label:'',
          placeholder:'Buscar por sala...',
          type:'text',
        },
        {//Windows
          id:'windows_search',
          label:'¿Ventana?',
          type:'select',
          options: ['Con ventana', 'Sin ventana'],
          placeholder:''
        },
        {//WC
          id:'wc_search',
          label:'¿WC cerca?',
          type:'select',
          options: ['Baño cerca', 'Baño lejos'],
          placeholder:''
        },
        {//Socket
          id:'socket_search',
          label:'¿Enchufe?',
          type:'select',
          options: ['Con enchufe', 'Sin enchufe'],
          placeholder:''
        },
      ];
      return filters;
      
    }
}
