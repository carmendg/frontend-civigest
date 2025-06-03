import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { Claims } from './config/claims';
import { User } from './models/user.model';
import { UserService } from './services/user.service';
import { UserStoreService } from './services/user-store.service';
import { Observable } from 'rxjs';



@Component({
  selector: 'app-root',
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  user$ : Observable<User | null>;
  showLoginDiv : boolean = true;
  isLogged: boolean = false;
  isAuthResolved :boolean = false;

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  constructor(private router: Router, private authService : AuthService, private userService : UserService, private userStoreService: UserStoreService) {
    this.router.events
    .pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    )
    .subscribe((event: NavigationEnd) => {
      this.showLoginDiv = event.urlAfterRedirects !== '/login';
    });
    this.user$ = this.userStoreService.getUser();
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.authService.authStatus$.subscribe(() => {
        this.checkAuth();
      });
      this.checkAuth();
    }
  }

  checkAuth(): void {
    // Si el token existe y es válido, mostrar el nombre del usuario y ocultar el login
    const token = localStorage.getItem('token');
    if (!token){
      this.handleNotValidToken();
    }
    else if(this.authService.isTokenValid()) {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodificar JWT
      const userID = decodedToken[Claims.id];
      if( userID){
        this.getUser(userID);
      }
    } else {
      // Si el token no es válido o no existe, mostrar el login
      this.authService.refreshToken().subscribe((response: any) => {
        if (response && response.jwtToken) {
          const newToken = response.jwtToken;
          const decodedToken = JSON.parse(atob(newToken.split('.')[1]));
          const userID = decodedToken[Claims.id];
          if (userID) {
            this.getUser(userID);
          }
        }
        else {
          this.handleNotValidToken();
        }
      });
    }
  }

  logout(event: Event): void {
    event.preventDefault(); // Evita que el enlace recargue la página
    this.authService.logout();
    this.userStoreService.clearUser();
    this.router.navigate(['/']); // O redirige a donde necesites
  }

  getUser(id: string): void{
    this.userService.getUser(id).subscribe({
      next: (userData: User) => {
        this.userStoreService.setUser(userData);
        this.isLogged = true;
        this.isAuthResolved =true;
      },
      error: () => {
        console.error('Error al obtener usuario');
        this.isLogged = false;
        this.isAuthResolved =true;
      }
    });
  }

  handleNotValidToken(): void{
      this.isLogged = false;
      this.isAuthResolved =true;
      this.userStoreService.clearUser();
  }
  
}
