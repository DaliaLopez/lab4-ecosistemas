import { useEffect, useState, useCallback } from "react";
import { getOrdersByStoreService } from "../../services/store.service";
import { getOrderDetailsService } from "../../services/store.service";
import axios from "axios";
import type { Order } from "../../types/orders.types";
import Navbar from "../../components/store/NavBar";

interface OrderDetailItem {
    name: string;
    quantity: number;
    priceattime: number;
}

export default function StoreDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [storeName, setStoreName] = useState("");

    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [details, setDetails] = useState<Record<string, OrderDetailItem[]>>({});
    const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

    const storeId = localStorage.getItem('storeId');
    const token = localStorage.getItem('token');
    const API_URL = "https://lab3-ecosistemas-backend.vercel.app/api";

    const fetchDashboardData = useCallback(async () => {
        if (!storeId) {
            setLoading(false);
            return;
        }

        try {
            const [ordersData, storeRes] = await Promise.all([
                getOrdersByStoreService(storeId),
                axios.get(`${API_URL}/stores/${storeId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setOrders(ordersData);
            setIsOpen(storeRes.data.isopen);
            setStoreName(storeRes.data.name);
        } catch (error) {
            console.error("Error detallado en el Dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, [storeId, token]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleToggleDetails = async (orderId: string) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            return;
        }

        setExpandedOrderId(orderId);

        if (!details[orderId]) {
            setLoadingDetails(orderId);
            try {
                const data = await getOrderDetailsService(orderId);
                setDetails(prev => ({ ...prev, [orderId]: data }));
            } catch (error) {
                console.error("ERROR AL TRAER DETALLES:", error);
            } finally {
                setLoadingDetails(null);
            }
        }
    };

    const toggleStoreStatus = async () => {
        try {
            const nuevoEstado = !isOpen;
            await axios.patch(`${API_URL}/stores/${storeId}`,
                { id: storeId, isopen: nuevoEstado },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsOpen(nuevoEstado);
        } catch (error) {
            console.error("Error al cambiar estado", error);
        }
    };

    if (!storeId && !loading) {
        return (
            <div className="p-20 text-center">
                <h1 className="text-red-500 font-semibold">Error de sesión</h1>
                <p className="text-gray-500">No se encontró el ID de la tienda. Por favor, vuelve a iniciar sesión.</p>
            </div>
        );
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-500">Cargando panel de control...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-10">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                        {storeName || "Mi Tienda"}
                    </h1>
                </div>

                <div className={`mb-10 p-6 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-6 ${isOpen ? 'bg-white border-green-200' : 'bg-white border-red-200'}`}>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            Tienda {isOpen ? 'abierta' : 'cerrada'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Controla si quieres abrir o cerrar tu tienda
                        </p>
                    </div>
                    <button
                        onClick={toggleStoreStatus}
                        className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                        {isOpen ? 'Cerrar' : 'Abrir'}
                    </button>
                </div>

                <h1 className="text-2xl font-semibold text-gray-800 mb-8">Pedidos</h1>

                <div className="grid gap-4">
                    {orders.length === 0 ? (
                        <div className="bg-white p-16 text-center rounded-xl border border-gray-200">
                            <p className="text-gray-400">Aún no hay pedidos.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="p-5 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Orden {order.id.slice(0, 8)}</p>
                                        <h3 className="text-gray-800 font-medium">Total ${order.total}</h3>
                                        <p className="text-sm text-orange-500 capitalize">{order.status}</p>
                                    </div>

                                    <button
                                        onClick={() => handleToggleDetails(order.id)}
                                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition"
                                    >
                                        {expandedOrderId === order.id ? 'Cerrar' : 'Detalles'}
                                    </button>
                                </div>

                                {expandedOrderId === order.id && (
                                    <div className="bg-gray-50 p-5 border-t border-gray-100">
                                        {loadingDetails === order.id ? (
                                            <p className="text-sm text-gray-500">Cargando productos...</p>
                                        ) : details[order.id] ? (
                                            <ul className="space-y-2">
                                                {details[order.id].map((item, index) => (
                                                    <li key={index} className="flex justify-between text-sm text-gray-700 border-b border-gray-200 pb-1">
                                                        <span><strong>{item.quantity}x</strong> {item.name}</span>
                                                        <span className="text-gray-400">Valor por unidad: ${item.priceattime}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-400">No se encontraron productos.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}