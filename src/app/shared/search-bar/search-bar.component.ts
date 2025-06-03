import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { SearchFilterDefinition } from '../../models/search-filter.model';


@Component({
  selector: 'app-search-bar',
  imports: [CommonModule, MatInputModule, FormsModule ],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent implements OnDestroy, OnInit {
  
  @Output() search = new EventEmitter<{text:string; filters:{[key:string]: any}}>();
  @Input() placeholder: string = 'Buscar por nombre...';
  @Input() availableFilters: SearchFilterDefinition[] = [];
  @Input() inputClass ='';

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  filters: {[key:string]:any} = {}
  showFilters: boolean = false;
  availableTextFilters: SearchFilterDefinition[] = [];
  availableSelectFilters: SearchFilterDefinition[] = [];

  searchText: string = '';
  private searchSubject = new Subject<string>();
  private subcription!: Subscription

  ngOnInit(): void {
    this.availableSelectFilters = this.availableFilters.filter(f => f.type === 'select');
    this.availableTextFilters = this.availableFilters.filter(f => f.type === 'text');

    this.subcription = this.searchSubject.pipe(
      debounceTime(800),
      distinctUntilChanged()
    )
    .subscribe(value => {
      console.log('enviando:', value)
      //this.search.emit(value);
      this.emitSearch();
    });
  }

  onInputChange(event: Event): void{
    const value = (event.target as HTMLInputElement).value
    this.searchSubject.next(value)
  }

  ngOnDestroy(): void {
    this.subcription.unsubscribe();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  emitSearch() {
    this.search.emit({
      text:this.searchText,
      filters:this.filters
    });
  }

  resetInput(): void{
    this.searchText='';
    if(this.inputRef){
      this.inputRef.nativeElement.value='';
    }
  }

}
