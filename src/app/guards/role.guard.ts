import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { UserStoreService } from '../services/user-store.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Role } from '../models/user.model';
import { Claims } from '../config/claims';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');
    if (!token) return this.router.parseUrl('/');
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const role = decodedToken[Claims.role];
    return (role && (role === Role.admin || role === Role.gestor))
      ? true : this.router.parseUrl('/');
      
  }
}