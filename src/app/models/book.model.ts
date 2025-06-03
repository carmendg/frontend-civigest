import { AuthorDetails } from "./author.model";

export interface CreateBook {
    isbn: string;
    title: string;
    summary: string;
    AuthorIds: number [];
    pagNum: string;
    publicationDate: string;
    photo: string;
    photoMimeType: string
    publisher: string;
}

export interface BookDetails{
    isbn: string;
    title: string;
    summary: string;
    authorIds: AuthorDetails[];
    pagNum: string;
    publicationDate: string;
    userCreatedId: string;
    id: number;
    usernameCreatedBy?: string;
    photo: string;
    photoMimeType: string;
    publisher: string;
}

export interface BookSearchParams{
    npag: number;       
    nelem: number;
    title?: string;
    isbn?:string;
    publisher?:string;
    orderBy?: string;
    orderField?: string;
}