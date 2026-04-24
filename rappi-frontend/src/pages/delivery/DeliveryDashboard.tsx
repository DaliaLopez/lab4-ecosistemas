import { useEffect, useState, useCallback } from "react";
import { getAvailableOrdersService, acceptOrderService, getOrderDetailsService } from "../../services/delivery.service";
import { getStoreByIdService } from "../../services/store.service";
import type { Order } from "../../types/orders.types";
import DeliveryNavbar from "../../components/delivery/NavBar";
import { useSupabase } from "../../hooks/useSupabase";
import OrderMap from "../../components/OrderMap";

interface OrderItemDetail {
    id: string;
    orderid: string;
    productid: string;
    quantity: number;
    priceattime: number;
    name: string;
}

export default function DeliveryDashboard() {
    const supabase = useSupabase();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [details, setDetails] = useState<Record<string, OrderItemDetail[]>>({});
    const [storeNames, setStoreNames] = useState<Record<string, string>>({});
    const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

    const deliveryId = localStorage.getItem('userId');
    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAvailableOrdersService();
            setOrders(data);

            const uniqueStoreIds = [...new Set(data.map(o => o.storeid))];
            uniqueStoreIds.forEach(async (id) => {
                try {
                    const store = await getStoreByIdService(id);
                    setStoreNames(prev => ({ ...prev, [id]: store.name }));
                } catch (error) { 
                    console.error("Error cargando nombre de tienda:", error); 
                }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    useEffect(() => {
        if (!supabase) return;
        const channel = supabase
            .channel('delivery-new-orders')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'orders', 
                filter: `status=eq.Creado` 
            }, 
            async (payload) => {
                const newOrder = payload.new as Order;
                setOrders((current) => [newOrder, ...current]);
                
                try {
                    const store = await getStoreByIdService(newOrder.storeid);
                    setStoreNames(prev => ({ ...prev, [newOrder.storeid]: store.name }));
                } catch (error) { console.error(error); }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [supabase]);

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
                console.log("Productos para orden " + orderId + ":", data);
                setDetails(prev => ({ ...prev, [orderId]: data }));
            } catch (error) {
                console.error("Error al traer detalles:", error);
            } finally {
                setLoadingDetails(null);
            }
        }
    };

    const handleAccept = async (orderId: string): Promise<void> => {
        if (!deliveryId) return;
        try {
            await acceptOrderService(orderId, deliveryId);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            alert("¡Pedido aceptado! Ve a la sección de 'Mis Pedidos' para iniciar la entrega.");
        } catch (error) { 
            console.error("No se pudo aceptar el pedido", error); 
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DeliveryNavbar />

            <main className="max-w-2xl mx-auto px-4 py-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Pedidos disponibles</h1>
                    <p className="text-gray-500">Acepta una orden para comenzar la ruta.</p>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center py-20 text-gray-400">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
                        <p>Buscando pedidos...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-16 rounded-3xl border border-gray-100 text-center shadow-sm">
                        <p className="text-gray-400 font-medium text-lg">No hay pedidos por ahora 🛵</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                                                {storeNames[order.storeid] || 'Tienda Aliada'}
                                            </span>
                                            <h3 className="text-2xl font-bold text-gray-900">Total: ${order.total}</h3>
                                            <p className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 8)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleDetails(order.id)}
                                            className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors"
                                        >
                                            {expandedOrderId === order.id ? 'OCULTAR' : 'VER DETALLES'}
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleAccept(order.id)}
                                        className="w-full bg-orange-600 text-white py-4 rounded-2xl text-sm font-bold hover:bg-orange-700 transition-all shadow-lg"
                                    >
                                        ACEPTAR PEDIDO
                                    </button>
                                </div>

                                {expandedOrderId === order.id && (
                                    <div className="bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top duration-300">
                                        <div className="h-44 w-full relative">
                                            {loadingDetails === order.id && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 text-[10px] text-gray-400">
                                                    Cargando mapa...
                                                </div>
                                            )}
                                            <OrderMap 
                                                deliveryPos={null} 
                                                destination={{
                                                    latitude: (order as any).destination_lat || (order.destination as any).latitude,
                                                    longitude: (order as any).destination_lng || (order.destination as any).longitude
                                                }} 
                                                isInteractive={false} 
                                            />
                                            <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-gray-600 z-1000">
                                                DESTINO
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}