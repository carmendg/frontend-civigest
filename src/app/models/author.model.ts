export interface AuthorDetails {
    nameSurname: string;
    id: number;
}

export interface AuthorSearchParams{
    npag: number;       
    nelem: number;
    name?: string;
    orderBy?: string;
    orderField?: string;
}