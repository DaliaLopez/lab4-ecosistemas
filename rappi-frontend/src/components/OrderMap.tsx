import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type LatLng } from '../types/orders.types';

const deliveryIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2801/2801846.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

const destinationIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

function RecenterMap({ position }: { position: LatLng }) {
    const map = useMap();
    useEffect(() => {
        if (position && typeof position.latitude === 'number' && typeof position.longitude === 'number') {
            map.setView([position.latitude, position.longitude]);
        }
    }, [position, map]);
    return null;
}

interface OrderMapProps {
    deliveryPos: LatLng | null;
    destination: LatLng | null;
    isInteractive?: boolean;
}

export default function OrderMap({ deliveryPos, destination, isInteractive }: OrderMapProps) {
    
   const normalize = (point: any) => {
        if (!point) return null;
        const lat = point.latitude ?? point.lat ?? point.destination_lat;
        const lng = point.longitude ?? point.lng ?? point.destination_lng;
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;
        return { lat, lng };
    };

    const dPos = normalize(deliveryPos);
    const dest = normalize(destination);

    if (!dPos && !dest) {
        return <div className="h-80 w-full bg-gray-100 flex items-center justify-center">Cargando...</div>;
    }

    const initialCenter: [number, number] = dPos 
        ? [dPos.lat, dPos.lng] 
        : [dest!.lat, dest!.lng];

    return (
        <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200">
            <MapContainer center={initialCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {dPos && (
                    <Marker position={[dPos.lat, dPos.lng]} icon={deliveryIcon}>
                        <Popup>Repartidor</Popup>
                    </Marker>
                )}

                {dest && (
                    <Marker position={[dest.lat, dest.lng]} icon={destinationIcon}>
                        <Popup>Tu entrega aquí</Popup>
                    </Marker>
                )}

                <RecenterMap position={deliveryPos || destination!} />
            </MapContainer>
            {isInteractive && (
                <div className="bg-orange-50 p-2 text-[10px] text-orange-700 text-center font-medium">
                    MUEVETE CON LAS FLECHAS ⬆️⬇️⬅️➡️
                </div>
            )}
        </div>
    );
}