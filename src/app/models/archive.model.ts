import { AuthorDetails } from "./author.model";

export interface CreateArchive {
    title: string;
    summary: string;
    AuthorIds: number [];
    publicationDate: string;
    file: string;
    fileMimeType: string;
}

export interface ArchiveDetails{
    title: string;
    summary: string;
    authorIds: AuthorDetails[];
    publicationDate: string;
    userCreatedId: string;
    id: number;
    usernameCreatedBy?: string;
    file: string;
    fileMimeType: string;
}

export interface ArchiveSearchParams{
    npag: number;       
    nelem: number;
    title?: string;
    publicationDate?:string;
    orderBy?: string;
    orderField?: string;
}