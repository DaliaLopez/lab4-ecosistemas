import { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSupabase } from "../hooks/useSupabase";
import { type Order, type LatLng, OrderStatus } from "../types/orders.types";

const API_URL = import.meta.env.VITE_API_URL;
const MOVE_DELTA = 0.0005;

interface PositionContextType {
  myPosition: LatLng;
}

const PositionContext = createContext<PositionContextType | null>(null);

export const PositionProvider = ({ children, activeOrder }: { children: React.ReactNode; activeOrder: Order | null }) => {
  const supabase = useSupabase();
  const [myPosition, setMyPosition] = useState<LatLng>({ 
    latitude: activeOrder?.delivery_position?.latitude || 3.4516, 
    longitude: activeOrder?.delivery_position?.longitude || -76.5320 
});
  const channelRef = useRef<any>(null);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    if (!activeOrder) return;
    channelRef.current = supabase.channel(`order:${activeOrder.id}`);
    channelRef.current.subscribe();
    
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [activeOrder, supabase]);

  const sendPositionUpdate = async (newPos: LatLng) => {
    if (!activeOrder) return;
    try {
      const response = await axios.patch(
        `${API_URL}/orders/${activeOrder.id}/position`,
        { latitude: newPos.latitude, longitude: newPos.longitude },
        getHeaders()
      );

      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event: "position-update",
          payload: {
            latitude: newPos.latitude,
            longitude: newPos.longitude,
            status: response.data.status
          },
        });


        if (response.data.status === OrderStatus.DELIVERED) {
          await channelRef.current.send({
            type: "broadcast",
            event: "status-update",
            payload: { status: OrderStatus.DELIVERED },
          });

          window.alert("¡Has llegado al destino! Pedido entregado.");
          window.location.href = "/delivery/dashboard"; 
        }
      }
    } catch (error) {
      console.error("Error actualizando posición:", error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeOrder || activeOrder.status !== OrderStatus.IN_DELIVERY) return;

      let deltaLat = 0;
      let deltaLng = 0;

      if (e.key === "ArrowUp") deltaLat = MOVE_DELTA;
      else if (e.key === "ArrowDown") deltaLat = -MOVE_DELTA;
      else if (e.key === "ArrowLeft") deltaLng = -MOVE_DELTA;
      else if (e.key === "ArrowRight") deltaLng = MOVE_DELTA;
      else return;

      e.preventDefault();

      setMyPosition((prev) => {
        const next = {
          latitude: prev.latitude + deltaLat,
          longitude: prev.longitude + deltaLng,
        };
        sendPositionUpdate(next);
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeOrder, myPosition]);

  return (
    <PositionContext.Provider value={{ myPosition }}>
      {children}
    </PositionContext.Provider>
  );
};

export const usePosition = () => {
  const context = useContext(PositionContext);
  if (!context) throw new Error("usePosition debe usarse dentro de PositionProvider");
  return context;
};