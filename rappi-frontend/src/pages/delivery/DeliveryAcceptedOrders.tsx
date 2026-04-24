import { useEffect, useState, useCallback } from "react";
import { getUserOrdersService, updateOrderStatusService, getOrderDetailsService } from "../../services/delivery.service";
import type { Order } from "../../types/orders.types";
import DeliveryNavbar from "../../components/delivery/NavBar";
import { PositionProvider, usePosition } from "../../providers/PositionProvider";
import OrderMap from "../../components/OrderMap";

interface OrderItemDetail {
    id: string;
    orderid: string;
    productid: string;
    quantity: number;
    priceattime: number;
    name: string;
}

const ActiveOrderContent = ({ order }: { order: Order }) => {
    const { myPosition } = usePosition();

    return (
        <div className="mt-4 animate-in fade-in duration-500">
            <OrderMap 
                deliveryPos={myPosition} 
                destination={{
                    latitude: (order as any).destination_lat,
                    longitude: (order as any).destination_lng
                }} 
                isInteractive={true} 
            />
        </div>
    );
};

export default function DeliveryAcceptedOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItemDetail[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

    const [activeMapId, setActiveMapId] = useState<string | null>(null);

    const deliveryId = localStorage.getItem('userId');

    const loadMyOrders = useCallback(async () => {
        if (!deliveryId) return;
        try {
            setLoading(true);
            const data = await getUserOrdersService(deliveryId);

            const activeDeliveries = data.filter((o: Order) => {
                const isMyDelivery = String(o.deliveryid) === String(deliveryId);
                const isNotFinished = o.status !== 'Entregado';
                return isMyDelivery && isNotFinished;
            });

            setOrders(activeDeliveries);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [deliveryId]);

    useEffect(() => {
        loadMyOrders();
    }, [loadMyOrders]);

    const viewDetails = async (orderId: string): Promise<void> => {
        try {
            setLoadingDetails(true);
            const items = await getOrderDetailsService(orderId);

            if (!items || items.length === 0) {
                alert("No se encontraron productos para esta orden.");
                return;
            }
            setSelectedOrderItems(items);
        } catch (error) {
            console.error("Error de conexión.", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCancel = async (orderId: string): Promise<void> => {
        if (!window.confirm("¿Deseas soltar este pedido?")) return;

        try {
            setLoading(true);
            await updateOrderStatusService(orderId, 'pending', null);
            await loadMyOrders();
            alert("Pedido liberado correctamente.");
        } catch (error) {
            console.error("No se pudo liberar el pedido.", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DeliveryNavbar />

            <main className="max-w-md mx-auto px-4 py-10">

                <header className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">Mis entregas</h1>
                    <p className="text-sm text-gray-400">Pedidos asignados actualmente</p>
                </header>

                {loading ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                        Cargando tus pedidos...
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-14 rounded-2xl border border-gray-100 text-center shadow-sm">
                        <p className="text-gray-400">No tienes entregas asignadas</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4"
                            >

                                <div className="flex justify-between items-start">

                                    <div>
                                        <p className="text-xs text-gray-400">
                                            #{order.id.slice(0, 8)}
                                        </p>

                                        <h3 className="text-gray-900 font-semibold text-lg">
                                            ${order.total}
                                        </h3>

                                        <span className="text-xs bg-orange-100 text-orange-500 px-2 py-1 rounded-md font-medium">
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-2 items-end">
                                        <button
                                            onClick={() => viewDetails(order.id)}
                                            disabled={loadingDetails}
                                            className="text-sm text-orange-500 hover:underline disabled:opacity-50"
                                        >
                                            {loadingDetails ? '...' : 'Ver Productos'}
                                        </button>
                                        <button
                                            onClick={() => setActiveMapId(activeMapId === order.id ? null : order.id)}
                                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                                                activeMapId === order.id 
                                                ? 'bg-gray-100 text-gray-600' 
                                                : 'bg-orange-500 text-white shadow-sm'
                                            }`}
                                        >
                                            {activeMapId === order.id ? 'Cerrar Mapa' : 'Navegar / Mapa'}
                                        </button>
                                    </div>

                                </div>

                                {activeMapId === order.id && (
                                    <PositionProvider activeOrder={order}>
                                        <ActiveOrderContent order={order} />
                                    </PositionProvider>
                                )}

                                <button
                                    onClick={() => handleCancel(order.id)}
                                    className="bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 transition"
                                >
                                    Soltar pedido
                                </button>

                            </div>
                        ))}
                    </div>
                )}
            </main>

            {selectedOrderItems && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">

                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 border border-gray-100 shadow-xl">

                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            Productos
                        </h2>

                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">

                            {selectedOrderItems.map((item) => (

                                <div
                                    key={item.id}
                                    className="flex justify-between items-center bg-gray-50 p-3 rounded-xl"
                                >

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-orange-100 text-orange-500 px-2 py-1 rounded-md font-medium">
                                            x{item.quantity}
                                        </span>

                                        <p className="text-sm text-gray-700">
                                            {item.name}
                                        </p>
                                    </div>

                                    <span className="text-xs text-gray-400">
                                        ${item.priceattime}
                                    </span>

                                </div>

                            ))}

                        </div>

                        <button
                            onClick={() => setSelectedOrderItems(null)}
                            className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition"
                        >
                            Cerrar
                        </button>

                    </div>

                </div>
            )}
        </div>
    );
}