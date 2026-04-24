import { useEffect } from "react";
import { useOrderTracking } from "../../providers/OrderTrackingProvider";
import OrderMap from "../../components/OrderMap";

interface Props {
    orderId: string;
    destination: { latitude: number; longitude: number };
}

export const OrderTrackingContent = ({ orderId, destination }: Props) => {
    const { deliveryPos, currentStatus, startTracking } = useOrderTracking();

    useEffect(() => {
        const stop = startTracking(orderId);
        return () => stop();
    }, [orderId, startTracking]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    <p className="text-sm font-medium text-blue-800">
                        {currentStatus === 'Entregado' ? '¡Llegó a tu destino!' : 'Repartidor en camino...'}
                    </p>
                </div>
                <span className="text-xs font-bold text-blue-600 uppercase">
                    {currentStatus}
                </span>
            </div>

            <div className="h-75 rounded-2xl overflow-hidden border border-gray-200">
                <OrderMap 
                    deliveryPos={deliveryPos} 
                    destination={destination} 
                    isInteractive={false} 
                />
            </div>
        </div>
    );
};