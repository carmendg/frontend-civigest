export interface CreateCopyBook {
    ubication: string;
    editionNum: string;
    purchaseDate: string;
    remarks: string;
    bookId: string;
    libraryId: string;
}

export interface CopyBookDetails{
    status: string;
    ubication: string;
    editionNum: string;
    purchaseDate: string;
    remarks: string;
    userCreatedId: string;
    id: number;
    usernameCreatedBy?: string;
    bookId: number;
    libraryId: number;
    libraryName?: string;
    bookTitle?: string;
}

export interface CopyBookSearchParams{
    npag: number;       
    nelem: number;
    library?: string;
    book?:string;
    status?:string;
    bookId?: number;
    libraryId?: number;
    orderBy?: string;
    orderField?: string;
}

export enum CopyBookStatus {
    available="Disponible",
    booked="Reservado",
    damaged="Dañado",
    lost="Perdido"
}