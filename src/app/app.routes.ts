import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './auth/register/register.component';
import { LoginGuard } from './guards/login.guard';
import { ProfileComponent } from './user/profile/profile.component';
import { AuthGuard } from './guards/auth.guard';
import { UserlistComponent } from './user/list/userlist.component';
import { RoleGuard } from './guards/role.guard';
import { UserviewComponent } from './user/view-edit/userview.component';
import { ProviderlistComponent } from './provider/providerlist/providerlist.component';
import { ProviderviewComponent } from './provider/providerview/providerview.component';
import { ProvidernewComponent } from './provider/providernew/providernew.component';
import { LibrarylistComponent } from './library/librarylist/librarylist.component';
import { LibraryviewComponent } from './library/libraryview/libraryview.component';
import { LibrarynewComponent } from './library/librarynew/librarynew.component';
import { BooklistComponent } from './book/booklist/booklist.component';
import { BookviewComponent } from './book/bookview/bookview.component';
import { BooknewComponent } from './book/booknew/booknew.component';
import { CopybooklistComponent } from './copybook/copybooklist/copybooklist.component';
import { CopybookviewComponent } from './copybook/copybookview/copybookview.component';
import { CopybooknewComponent } from './copybook/copybooknew/copybooknew.component';
import { SeatlistComponent } from './seat/seatlist/seatlist.component';
import { SeatviewComponent } from './seat/seatview/seatview.component';
import { SeatnewComponent } from './seat/seatnew/seatnew.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [LoginGuard]},
    //USERS
    { path: 'profile', component: ProfileComponent, canActivate:[ AuthGuard ]},
    { path: 'userlist', component: UserlistComponent, canActivate:[ AuthGuard, RoleGuard ]},
    { path: 'userview/:id', component: UserviewComponent, canActivate: [AuthGuard, RoleGuard ]},
    //PROVIDERS
    { path: 'providerlist', component:ProviderlistComponent, canActivate: [AuthGuard, RoleGuard]},
    { path: 'providerview/:id', component:ProviderviewComponent, canActivate:[AuthGuard, RoleGuard]},
    { path: 'providernew', component:ProvidernewComponent, canActivate:[AuthGuard,RoleGuard]},
    //LIBRARIES
    { path: 'librarylist', component:LibrarylistComponent},
    { path: 'libraryview/:id', component:LibraryviewComponent},
    { path: 'librarynew', component:LibrarynewComponent, canActivate:[AuthGuard, RoleGuard]},
    //BOOKS
    { path: 'booklist', component:BooklistComponent},
    { path: 'bookview/:id', component:BookviewComponent},
    { path: 'booknew', component:BooknewComponent, canActivate:[AuthGuard, RoleGuard]},
    //COPYBOOKS
    { path: 'copybooklist', component:CopybooklistComponent},
    { path: 'copybookview/:id', component:CopybookviewComponent},
    { path: 'copybooknew', component:CopybooknewComponent, canActivate:[AuthGuard, RoleGuard]},
    //SEAT
    { path: 'seatlist', component:SeatlistComponent},
    { path: 'seatview/:id', component:SeatviewComponent},
    { path: 'seatnew', component:SeatnewComponent, canActivate:[AuthGuard, RoleGuard]},

    { path: '', component: HomeComponent }
  ];
