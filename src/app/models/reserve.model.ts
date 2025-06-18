export interface CreateReserve {
    reserveDate: string;
    seatReservedId: number;
}

export enum ReserveStatus {
    assists="Asiste",
    missing="Ausencia",
}

export interface ReserveDetails{
    reserveDate: string;
    floorNum: number;
    roomNum: number;
    seatNum: number;
    status: string;
    libraryId: number;
    userReservedId: string;
    id: number;
    usernameReservedBy?: string;
    library?: string;
    seatReservedId: number;
}

export interface ReserveSearchParams{
    npag: number;       
    nelem: number;
    status?: string;
    libraryId?: number;
    library?: string;
    userId?: number;
    userName?: string;
    orderBy?: string;
    orderField?: string;
}

