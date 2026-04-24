import axios from "axios";
import type { Order, CreateOrderDTO } from "../types/orders.types";
import type { Store } from "../types/stores.types"; 
import type { Product } from "../types/products.types";

const API_URL = "http://localhost:1234/api"; //

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const getStoresService = async (): Promise<Store[]> => {
    const response = await axios.get(`${API_URL}/stores`, getAuthHeaders());
    return response.data;
};

export const getProductsByStoreService = async (storeId: string): Promise<Product[]> => {
    const response = await axios.get(`${API_URL}/products/stores/${storeId}`, getAuthHeaders());
    return response.data;
};

export const createOrderService = async (order: CreateOrderDTO): Promise<Order> => {
    const response = await axios.post(`${API_URL}/orders`, order, getAuthHeaders());
    return response.data;
};

export const getUserOrdersService = async (userId: string): Promise<Order[]> => {
    const response = await axios.get(`${API_URL}/orders/user/${userId}`, getAuthHeaders());
    return response.data;
};