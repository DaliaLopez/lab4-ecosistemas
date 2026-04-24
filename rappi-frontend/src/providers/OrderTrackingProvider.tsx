import { createContext, useContext, useState, useCallback } from "react";
import { useSupabase } from "../hooks/useSupabase";
import { type LatLng, OrderStatus } from "../types/orders.types";

interface OrderTrackingContextType {
  deliveryPos: LatLng | null;
  currentStatus: OrderStatus | null;
  isTracking: boolean;
  startTracking: (orderid: string) => () => void;
}

const OrderTrackingContext = createContext<OrderTrackingContextType | null>(null);

export const OrderTrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = useSupabase();
  const [deliveryPos, setDeliveryPos] = useState<LatLng | null>(null);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const startTracking = useCallback((orderid: string) => {
    setDeliveryPos(null);
    setCurrentStatus(null);
    setIsTracking(true);

    const channel = supabase.channel(`order:${orderid}`);

    channel
      .on("broadcast", { event: "position-update" }, ({ payload }) => {
        setDeliveryPos({
          latitude: payload.latitude,
          longitude: payload.longitude,
        });
        if (payload.status) setCurrentStatus(payload.status);
      })
      .on("broadcast", { event: "status-update" }, ({ payload }) => {
        setCurrentStatus(payload.status);
        if (payload.status === 'Entregado') {
          window.alert("¡Tu pedido ha llegado a su destino!");
        }})
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderid}` },
        (payload) => {
          const newStatus = (payload.new as any).status;
          setCurrentStatus(newStatus);
          if (newStatus === 'Entregado') {
            window.alert("¡Pedido entregado con éxito!");
          }
        }
      )
      .subscribe();

    return () => {
      setIsTracking(false);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <OrderTrackingContext.Provider value={{ deliveryPos, currentStatus, isTracking, startTracking }}>
      {children}
    </OrderTrackingContext.Provider>
  );
};

export const useOrderTracking = () => {
  const context = useContext(OrderTrackingContext);
  if (!context) throw new Error("useOrderTracking debe usarse dentro de OrderTrackingProvider");
  return context;
};