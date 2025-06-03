export interface CreateUser {
    name: string;
    email: string;
    password: string;
    surname: string;
    dni: string;
    phoneNumber: string;
    birthdayDate: string;
    address: string;
}

export interface User {

    name: string;
    email: string;
    password: string;
    surname: string;
    dni: string;
    phoneNumber: string;
    birthdayDate: string; 
    address: string;
    registrationDate: string; 
    role: string;
    status: string;
}

export enum Status {
    active="Activo",
    inactive="Inactivo",
    punished="Sancionado",
}

export enum Role {
    admin="Admin",
    gestor="Gestor",
    cliente="Cliente"
}

export interface UserDetailsList {
    name: string;
    email: string;
    surname: string;
    dni: string;
    phoneNumber: string;
    birthdayDate: string; 
    address: string;
    registrationDate: string; 
    role: string;
    status: string;
    id: number;
}

export interface UserSearchParams{
    npag: number;       
    nelem: number;      
    nombre?: string;    
    apellido?: string;  
    estado?:string;
    orden?: string;     
    campoOrden?: string;
}
