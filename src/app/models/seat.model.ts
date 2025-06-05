export interface CreateSeat {
    seatNum: number;
    floorNum: number;
    roomNum: number;
    hasWindow: boolean;
    hasSocket: boolean;
    isWCNear: boolean;
    status: string;
    libraryId: number;
}

export enum SeatStatus {
    available="Disponible",
    reserved="Ocupado",
    damaged="Dañado",
}

export interface SeatDetails{
    seatNum: number;
    floorNum: number;
    roomNum: number;
    hasWindow: boolean;
    hasSocket: boolean;
    isWCNear: boolean;
    status: string;
    libraryId: number;
    remarks: string;
    userCreatedId: string;
    id: number;
    usernameCreatedBy?: string;
    libraryName?: string;
}

export interface SeatSearchParams{
    npag: number;       
    nelem: number;
    status?: string;
    libraryId?: number;
    floorNum?: boolean;
    roomNum?: boolean;
    hasWindow?: boolean;
    hasSocket?: boolean;
    isWCNear?: boolean;
    orderBy?: string;
    orderField?: string;
}

