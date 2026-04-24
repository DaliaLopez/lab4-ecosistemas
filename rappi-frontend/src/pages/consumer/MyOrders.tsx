import { useEffect, useState } from "react";
import { getUserOrdersService } from "../../services/consumer.service";
import { getStoreByIdService } from "../../services/store.service";
import type { Order } from "../../types/orders.types";
import Navbar from "../../components/consumer/NavBar";
import { OrderTrackingProvider } from "../../providers/OrderTrackingProvider";
import { OrderTrackingContent } from "../../components/consumer/OrderTrackingContent";

import { useSupabase } from "../../hooks/useSupabase";

export default function MyOrders() {
    const supabase = useSupabase();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [storeNames, setStoreNames] = useState<Record<string, string>>({});

    const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

    const loadOrders = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const data: Order[] = await getUserOrdersService(userId);
            const sortedOrders = data.sort((a, b) =>
                new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
            );
            setOrders(sortedOrders);

            const uniqueStoreIds = [...new Set(sortedOrders.map(o => o.storeid))];
            uniqueStoreIds.forEach(async (id) => {
                try {
                    const store = await getStoreByIdService(id);
                    setStoreNames(prev => ({ ...prev, [id]: store.name }));
                } catch (error) { console.error("Error al cargar pedidos:", error); } finally { setLoading(false); }
            });

        } catch (error) {
            console.error("Error al cargar pedidos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId || !supabase) return;

        const channel = supabase
            .channel('consumer-realtime-orders')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `consumerid=eq.${userId}`
                },
                (payload) => {
                    const updatedOrder = payload.new as Order;
                    setOrders((currentOrders) =>
                        currentOrders.map((o) =>
                            o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'Creado': return 'bg-yellow-100 text-yellow-700';
            case 'En entrega': return 'bg-blue-100 text-blue-700';
            case 'Entregado': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-semibold text-gray-800 mb-8">Mis pedidos</h1>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <p className="text-center text-gray-400 py-10">Aún no has realizado pedidos.</p>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                                {storeNames[order.storeid] || 'Cargando tienda...'}
                                            </span>
                                            <p className="text-xs text-gray-400">ID {order.id.slice(0, 8)}</p>
                                        </div>
                                        <h3 className="text-gray-800 font-semibold">Total ${order.total}</h3>
                                        <p className="text-sm text-gray-500">{new Date(order.createdat).toLocaleDateString()}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusStyle(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    {order.status === 'En entrega' && (
                                        <button
                                            onClick={() => setTrackingOrder(order)}
                                            className="mt-4 w-full py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
                                        >
                                            Seguir repartidor en vivo
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {trackingOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Rastreo de pedido</h2>
                            <button
                                onClick={() => setTrackingOrder(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <OrderTrackingProvider>
                            <OrderTrackingContent
                                orderId={trackingOrder.id}
                                destination={{
                                    latitude: (trackingOrder as any).destination_lat || trackingOrder.destination?.latitude,
                                    longitude: (trackingOrder as any).destination_lng || trackingOrder.destination?.longitude
                                }}
                            />
                        </OrderTrackingProvider>

                        <button
                            onClick={() => setTrackingOrder(null)}
                            className="w-full mt-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                        >
                            Cerrar mapa
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}