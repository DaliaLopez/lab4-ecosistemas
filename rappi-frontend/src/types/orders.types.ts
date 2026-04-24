import type { CreateOrderItemDTO } from "./orderItems.types";

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
    items: Omit<CreateOrderItemDTO, 'orderid'>[];
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

export const OrderStatus = {
  CREATED: 'Creado',
  IN_DELIVERY: 'En entrega',
  DELIVERED: 'Entregado',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];