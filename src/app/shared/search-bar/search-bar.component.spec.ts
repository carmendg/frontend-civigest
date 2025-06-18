import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { SearchBarComponent } from './search-bar.component';


describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  //Check toggle filter
  it('should toggle filter when user click on the button', () => {
    expect(component.showFilters).toBeFalse();
    component.toggleFilters();
    expect(component.showFilters).toBeTrue();
    component.toggleFilters();
    expect(component.showFilters).toBeFalse();
  });
  //Check to clear fields after click on resetInput
  it('should clear fields after click on resetInput', () => {
    component.searchText = 'Algo que se quiere buscar';
    fixture.detectChanges();
    const element: HTMLInputElement = document.createElement('input');
    component.inputRef = {nativeElement:element} as any;
    element.value = 'Algo en otro campo';
    
    component.resetInput();
    expect(component.searchText).toBe('');
    expect(component.inputRef.nativeElement.value).toBe('');
  });
  //Check debounceTime
  it('should emit serach after debounceTime on input change', fakeAsync(() => {
    spyOn(component, 'emitSearch');
    const mockEvent = { target: {value: 'test'} } as unknown as Event;
    component.onInputChange(mockEvent);
    tick(800);
    expect(component.emitSearch).toHaveBeenCalled();
  }));
  //Check separated filters
  it('should separate filters by type', () => {
    component.availableFilters = [
      {type: 'text', id:'name', label:'name', placeholder:''},
      {type: 'select', id:'option', label:'option', placeholder:'', options: ['A', 'B']},
      {type: 'text', id:'surname', label:'surname', placeholder:''}
    ];
    component.ngOnInit();
    expect(component.availableTextFilters.length).toBe(2);
    expect(component.availableSelectFilters.length).toBe(1);
  }) 

});
