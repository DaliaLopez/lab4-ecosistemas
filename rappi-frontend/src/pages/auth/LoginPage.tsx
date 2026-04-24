import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types/auth.types';
import { login } from '../../services/auth.service';
import type { Store } from '../../types/stores.types';
import axios from 'axios';

export default function LoginPage() {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login(credentials);
            const token = data.session.access_token;
            const userId = data.user.id;
            const role = data.user.user_metadata.role;

            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            localStorage.setItem('userRole', role);

            if (role === UserRole.CONSUMER) {
                navigate('/browse');
            } else if (role === UserRole.STORE) {
                try {
                    const response = await axios.get<Store>(`https://lab4-ecosistemas-backend.vercel.app/api/stores/user/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const myStore = response.data;

                    if (myStore && myStore.id) {
                        localStorage.setItem('storeId', myStore.id);
                        navigate('/store/dashboard');
                    }
                } catch (err) {
                    console.error("Error al obtener tiendas:", err);
                }

            } else if (role === UserRole.DELIVERY) {
                navigate('/delivery/dashboard');
            } else {
                navigate('/login');
            }

        } catch (error) {
            console.error("Credenciales invalidas", error);
            alert("Error al iniciar sesión. Revisa tus datos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">

            <form
                onSubmit={handleLogin}
                className="bg-white w-full max-w-md p-10 rounded-3xl border border-gray-100 shadow-xl flex flex-col gap-6"
            >

                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Rappi<span className="text-orange-500">Lab</span>
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Inicia sesión para continuar
                    </p>
                </div>

                <div className="flex flex-col gap-4">

                    <input
                        className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                        type="email"
                        placeholder="Correo electrónico"
                        required
                        onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                    />

                    <input
                        className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                        type="password"
                        placeholder="Contraseña"
                        required
                        onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                    />

                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`bg-orange-500 text-white py-4 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-all shadow-md shadow-orange-200 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {loading ? 'Cargando...' : 'Iniciar sesión'}
                </button>

                <p className="text-sm text-center text-gray-500">
                    ¿No tienes cuenta?
                    <span
                        onClick={() => navigate('/register')}
                        className="text-orange-500 ml-1 cursor-pointer hover:underline font-medium"
                    >
                        Regístrate
                    </span>
                </p>

            </form>

        </div>
    );
}