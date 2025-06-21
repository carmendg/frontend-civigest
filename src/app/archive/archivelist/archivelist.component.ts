import { Component, OnInit } from '@angular/core';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ArchiveDetails, ArchiveSearchParams } from '../../models/archive.model';
import { PagedResponse } from '../../models/paged-response.model';
import { SearchFilterDefinition } from '../../models/search-filter.model';
import { ArchiveService } from '../../services/archive.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/user.model';

@Component({
  selector: 'app-archivelist',
  imports: [SearchBarComponent, CommonModule, MatProgressSpinnerModule],
  templateUrl: './archivelist.component.html',
  styleUrl: './archivelist.component.css'
})
export class ArchivelistComponent implements OnInit{

  searchParams: ArchiveSearchParams={
    npag:0,
    nelem:3,
    orderBy:'asc',
    orderField:'fecha'
  };

  pagedResponse!: PagedResponse<ArchiveDetails>;
  loading: boolean = false;
  archivos: ArchiveDetails[] = [];
  canAdd: boolean = false;
  filters: SearchFilterDefinition[] = [];

  constructor(private archiveService: ArchiveService, private dialog: MatDialog, private authService: AuthService,
              private snackBar: MatSnackBar, private router:Router ) {}

  getListArchive(){
    this.loading = true;

    this.archiveService.getArchiveList(this.searchParams).subscribe({
      next: (response) => {
        this.pagedResponse = response;
        this.archivos.push(...response.items);
        this.canAdd = this.checkIfCanAdd();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  ngOnInit(): void {
    this.filters = this.archiveService.getFilterArchiveList();
    this.getListArchive();
  }

  verDetalles(archive: ArchiveDetails){
    this.router.navigate(['/archiveview', archive.id]);
  }

  loadMore(){
    this.searchParams.npag++;
    this.getListArchive(); 
  }

  applyFilter(event: {text:string; filters: {[key:string]:any}}){
    const { text, filters } = event;

    this.searchParams.title = text?.trim().toLowerCase() || '';
    this.searchParams.publicationDate = filters['date_search'] || '';
    this.searchParams.npag=0;
    this.archivos=[];
    this.getListArchive();

  }

  createArchive(){
    this.router.navigate(['/archivenew']);
  }

  checkIfCanAdd(): boolean{
    const userrole= this.authService.getRoleFromToken();
    if(userrole && userrole === Role.admin) return true;
    if(userrole && userrole === Role.gestor) return true;
    return false;
  }

  getAuthorsList(libro: ArchiveDetails): string{
    return libro.authorIds?.map(b => b.nameSurname).join(', ') || "Anónimo";
  }

}
