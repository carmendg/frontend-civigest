export interface CreateProvider {
    name: string;
    email: string;
    contactPersonName: string;
    dni: string;
    phoneNumber: string;
    address: string;
}

export interface ProviderDetails{
    name: string;
    email: string;
    contactPersonName: string;
    dni: string;
    phoneNumber: string;
    address: string;
    userCreatedId: string;
    id: number;
    usernameCreatedBy?: string;
}

export interface ProviderSearchParams{
    npag: number;       
    nelem: number;
    name?: string;
    orderBy?: string;
    orderField?: string;
}

