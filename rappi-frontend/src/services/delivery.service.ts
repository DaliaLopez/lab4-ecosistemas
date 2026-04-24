import axios from "axios";
import type { Order } from "../types/orders.types";

const API_URL = "https://lab4-ecosistemas-backend.vercel.app/api";

const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getAvailableOrdersService = async (): Promise<Order[]> => {
    const response = await axios.get(`${API_URL}/orders/available`, getAuthHeaders());
    return response.data;
};

export const acceptOrderService = async (orderId: string, deliveryId: string) => {
    const response = await axios.patch(`${API_URL}/orders/${orderId}/accept`, { deliveryid: deliveryId }, getAuthHeaders());
    return response.data;
};

export const updateOrderStatusService = async (
    orderId: string,
    status: 'pending' | 'delivered',
    deliveryid: string | null
): Promise<Order> => {
    const token = localStorage.getItem('token');
    const res = await axios.patch(`${API_URL}/orders/${orderId}/status`,
        { status, deliveryid },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return res.data;
};

export const getOrderDetailsService = async (orderId: string) => {
    const response = await axios.get(`${API_URL}/orders/${orderId}/details`, getAuthHeaders());
    return response.data;
};

export const getUserOrdersService = async (userId: string): Promise<Order[]> => {
    const response = await axios.get(`${API_URL}/orders/user/${userId}`, getAuthHeaders());
    return response.data;
};