export interface SearchFilterDefinition {
    id: string;
    label: string;
    type: FilterType;
    options?: string [];
    placeholder:string;
}

export type FilterType = 'text' | 'select'