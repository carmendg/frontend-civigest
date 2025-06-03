export interface CreateLibrary {
    name: string;
    email: string;
    description: string;
    cif: string;
    phoneNumber: string;
    address: string;
    photo: string;
    photoMimeType: string
}

export interface LibraryDetails{
    name: string;
    email: string;
    description: string;
    cif: string;
    phoneNumber: string;
    address: string;
    userCreatedId: string;
    id: number;
    usernameCreatedBy?: string;
    photo: string;
    photoMimeType: string;
}

export interface LibrarySearchParams{
    npag: number;       
    nelem: number;
    name?: string;
    orderBy?: string;
    orderField?: string;
}