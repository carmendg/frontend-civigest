import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArchiveDetails, ArchiveSearchParams, CreateArchive } from '../models/archive.model';
import { ApiBaseUrls } from '../config/api-endpoints';
import { PagedResponse } from '../models/paged-response.model';
import { SearchFilterDefinition } from '../models/search-filter.model';

@Injectable({
  providedIn: 'root'
})
export class ArchiveService {

  constructor(private http: HttpClient) { }

  create(archive: CreateArchive): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.post(`${ApiBaseUrls.archives}`, archive, {headers});
  }

  getArchive(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.get(`${ApiBaseUrls.archives}/${id}`, {headers});
  }

  updateArchive(id:string, archive: ArchiveDetails): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.put(`${ApiBaseUrls.archives}/${id}`, archive, {headers});
  }

  deleteArchive(id:string): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });
    return this.http.delete(`${ApiBaseUrls.archives}/${id}`, {headers});
  }

  getArchiveList(request: ArchiveSearchParams): Observable<PagedResponse<ArchiveDetails>> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${token}`
    });

    let params = new HttpParams() 
      .set('npag', request.npag.toString())
      .set('nelem', request.nelem.toString());

    if (request.title) params = params.set('titulo', request.title);
    if (request.publicationDate) params = params.set('fecha', request.publicationDate);
    if (request.orderBy) params = params.set('orden', request.orderBy);
    if (request.orderField) params = params.set('campoOrden', request.orderField);

    return this.http.get<PagedResponse<ArchiveDetails>>(`${ApiBaseUrls.archives}/`, {params: params, headers:headers });
  }

  getFilterArchiveList(): SearchFilterDefinition[] {
    let filters: SearchFilterDefinition[] =[
      {//PublicationDate
        id:'date_search',
        label:'',
        placeholder:'Buscar por fecha...',
        type:'text',
      },
      {//Author
        id:'author_search',
        label:'',
        type:'text',
        placeholder:'Buscar por autor...'
      },
    ];
    return filters;
    
  }
}
