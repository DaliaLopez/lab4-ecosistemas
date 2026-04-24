import axios from "axios";
import type { CreateUserDTO, AuthenticateUserDTO } from "../types/auth.types";

const API_URL = "https://lab4-ecosistemas-backend.vercel.app/api/auth";

export const register = async (userData: CreateUserDTO) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
};

export const login = async (credentials: AuthenticateUserDTO) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
};