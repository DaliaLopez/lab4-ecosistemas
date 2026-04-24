import axios from "axios";
import type { CreateProductDTO } from "../types/products.types";
import type { Order } from "../types/orders.types";

const API_URL = "https://lab4-ecosistemas-backend.vercel.app/api";

const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getOrdersByStoreService = async (storeId: string): Promise<Order[]> => {
    const response = await axios.get(`${API_URL}/orders/store/${storeId}`, getAuthHeaders());
    return response.data;
};

export const updateOrderStatusService = async (orderId: string, status: string) => {
    const response = await axios.patch(`${API_URL}/orders/status/${orderId}`, { status }, getAuthHeaders());
    return response.data;
};

export const createProductService = async (product: CreateProductDTO) => {
    const response = await axios.post(`${API_URL}/products`, product, getAuthHeaders());
    return response.data;
};

export const deleteProductService = async (productId: string) => {
    await axios.delete(`${API_URL}/products/${productId}`, getAuthHeaders());
};

export const getStoreByIdService = async (storeId: string) => {
    const response = await axios.get(`${API_URL}/stores/${storeId}`, getAuthHeaders());
    return response.data;
};

export const getOrderDetailsService = async (orderId: string) => {
    const response = await axios.get(`${API_URL}/orders/${orderId}/details`, getAuthHeaders());
    return response.data;
};