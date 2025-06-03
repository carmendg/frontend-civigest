import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, switchMap, of} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiBaseUrls } from '../config/api-endpoints';
import { Claims } from '../config/claims';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authStatusSubject = new BehaviorSubject<boolean>(this.isTokenValid());
  authStatus$ = this.authStatusSubject.asObservable();
  private roleStatusSubject = new BehaviorSubject<string | null>(null);
  roleStatus$ = this.roleStatusSubject.asObservable();
  private userStatusSubject = new BehaviorSubject<string | null>(null);
  userStatus$ = this.userStatusSubject.asObservable();


  constructor(private http: HttpClient) { 
    const token = this.isTokenValid();
    if(token){
      console.log(token);
      const role = this.getRoleFromToken();
      const user = this.getUserIdFromToken();
      console.log(role, user);
      this.roleStatusSubject.next(role);
      this.userStatusSubject.next(user);
    }
  }
  

  login(credentials: { email: string; pwd: string }): Observable<any> {
    return this.http.post(`${ApiBaseUrls.auth}/login`, credentials);
  }

  saveTokens(tokens: { token: string; refreshToken: string }): void {
    localStorage.setItem('token', tokens.token);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    this.authStatusSubject.next(true);
  }

  logout(): void{
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.authStatusSubject.next(false);
  }

  isTokenValid(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      return token ? !this.isTokenExpired(token) : false;
    }
    return false;
  }

  private isTokenExpired(token: string): boolean {
    try {
        const decoded = JSON.parse(atob(token.split('.')[1])); // Decodificar JWT
        const expirationTime = decoded.exp * 1000; // El tiempo de expiración en milisegundos
        const now = new Date().getTime();
        return expirationTime <  now; // Si el token ha expirado
    } catch (error) {
        return true; // Si el token no se puede decodificar, lo consideramos inválido
    }
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${refreshToken}`,
      'Content-Type': 'application/json'
    });
    if (refreshToken) {
      const decodedToken = JSON.parse(atob(refreshToken.split('.')[1]));
      const body = JSON.stringify(decodedToken[Claims.email]);
      return this.http.post(`${ApiBaseUrls.auth}/refreshToken`,  body, {headers}).pipe(
        switchMap((response: any) => {
          // Si se obtiene un nuevo accessToken, lo guardamos en localStorage
          localStorage.setItem('token', response.jwtToken);
          return of(response);
        }),
        catchError((error) => {
          console.error('Error al renovar el token:', error);
          return of(null); // Retornar null si ocurre un error
        })
      );
    }
    return of(null); // Si no hay refreshToken, retornamos null
  }

  notifyAuthChange(): void {
    this.authStatusSubject.next(this.isTokenValid());
  }

  getToken(): any{
    return localStorage.getItem('token');
  }

  getUserIdFromToken(): string | null {
     if (typeof window !== 'undefined' && window.localStorage){
      const token = localStorage.getItem('token');
      if (!token) {
        //this.userStatusSubject.next(null);
        return null;
      }      
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      //this.userStatusSubject.next(decodedToken[Claims.id]);
      return decodedToken[Claims.id];
     }
     //this.userStatusSubject.next(null);
     return null;
  }

  getRoleFromToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage){
      const token = localStorage.getItem('token');
      if (!token) {
      //  this.roleStatusSubject.next(null);
        return null;

      }
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
     // this.roleStatusSubject.next(decodedToken[Claims.role]);
      return decodedToken[Claims.role];
    }
    //this.roleStatusSubject.next(null);
    return null;
  }


}
