export interface Order {
    id: string;
    consumerid: string;
    storeid: string;
    deliveryid: string | null;
    status: OrderStatus;
    total: number;
    createdat: string;
    delivery_position?: LatLng;
    destination: LatLng;
}

export interface CreateOrderDTO {
    consumerid: string;
    storeid: string;
    total: number;
    destination: LatLng;
}

export interface AcceptOrderDTO {
    id: string;
    deliveryid: string;
}

export interface UpdateOrderStatusDTO {
    id: string;
    status: string;
    deliveryid: null;
}

export interface UpdateOrderPositionDTO {
    latitude: number;
    longitude: number;
}

export interface LatLng {
    latitude: number;
    longitude: number;
}

export enum OrderStatus {
  CREATED = "Creado",
  IN_DELIVERY = "En entrega",
  DELIVERED  = "Entregado",
}