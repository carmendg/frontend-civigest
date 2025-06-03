import { Component, Inject, OnInit, ViewChild,  } from '@angular/core';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthorDetails, AuthorSearchParams } from '../../models/author.model';
import { AuthorService } from '../../services/author.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-author-selector-dialog',
  imports: [SearchBarComponent, CommonModule, MatProgressSpinnerModule, MatDialogModule, MatButtonModule],
  templateUrl: './author-selector-dialog.component.html',
  styleUrl: './author-selector-dialog.component.css'
})
export class AuthorSelectorDialogComponent implements OnInit {

  searchParams: AuthorSearchParams = {
    npag:0,
    nelem:5,
  }

  loading: boolean = false;
  searchdone: boolean = false;
  filteredAuthors: AuthorDetails[] = [];
  selectedAuthors: AuthorDetails[] = [];
  searchInput: string = '';

  @ViewChild(SearchBarComponent) searchBarComponent!: SearchBarComponent;

  constructor(private authorService: AuthorService, public dialog: MatDialogRef<AuthorSelectorDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { title: string; selectedAuthors: AuthorDetails[]}){

  }

  getListAuthors (){
    this.loading = true;
    this.authorService.getAuthorList(this.searchParams).subscribe({
      next: (response) => {
        this.filteredAuthors = response.items.filter(
          a => !this.selectedAuthors.some(sel => sel.id === a.id));
        this.loading = false;
      },
      error: () =>{
        this.loading =false;
      }
    });
  }

  ngOnInit(): void {
    if(this.data.selectedAuthors){
      this.selectedAuthors = [...this.data.selectedAuthors];
    }

    this.getListAuthors();
  }

  applyFilter(event: {text:string; filters: {[key:string]:any}}){
    const { text } = event;
    this.searchInput = text?.trim().toUpperCase() || '';

    this.searchParams.name = this.searchInput;
    this.searchParams.npag = 0;
    this.filteredAuthors= [];
    this.getListAuthors();
    this.searchdone =true;
  }

  removeAuthor(author: AuthorDetails){
    this.selectedAuthors = this.selectedAuthors.filter((a: AuthorDetails) => a.id !== author.id);
  }

  onConfirm(): void {
    this.dialog.close(this.selectedAuthors);
  }


  onCancel(): void{
    this.dialog.close(false);
  }

  addAuthor(author:AuthorDetails): void{
    const exists = this.selectedAuthors.some(a => a.id === author.id);
    if(!exists){
      this.selectedAuthors.push(author);
    }
    this.filteredAuthors = [];
  }

  createAuthor(): void {
    if(!this.searchInput) return;
    this.loading = true;
    this.authorService.create(this.searchInput).subscribe({
      next: (res) => {

        const newAuthor:AuthorDetails = {
          id:res.author.id,
          nameSurname:res.author.nameSurname
        }

        this.selectedAuthors.push(newAuthor);
        this.filteredAuthors = [];
        this.loading = false;
        this.searchInput ='';
        this.searchdone = false;

        setTimeout(() =>{
          this.searchBarComponent.resetInput();
        })
      },
      error: (err) => {
        console.error('Fallo', err)
        this.loading = false;
      }
    });
  }

}
