import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { getProductsByStoreService, getStoresService, createOrderService } from '../../services/consumer.service';
import type { Product } from '../../types/products.types';
import type { Store } from '../../types/stores.types';
import type { CreateOrderDTO, LatLng } from '../../types/orders.types';

import ProductCard from '../../components/consumer/ProductCard';
import CartSidebar from '../../components/consumer/CartSideBar';
import Navbar from '../../components/consumer/NavBar';
import axios from 'axios';

const deliveryIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
});

interface CartItem extends Product {
    quantity: number;
}

function LocationSelector({ onLocationSelect, position }: { onLocationSelect: (pos: LatLng) => void, position: LatLng | null }) {
    useMapEvents({
        click(e) {
            onLocationSelect({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
            });
        },
    });

    return position ? <Marker position={[position.latitude, position.longitude]} icon={deliveryIcon} /> : null;
}

export default function StoreDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [storeName, setStoreName] = useState("");
    const [loading, setLoading] = useState(true);
    const [destination, setDestination] = useState<LatLng | null>(null);

    useEffect(() => {
        if (!id) {
            navigate('/browse');
            return;
        }

        const loadData = async () => {
            try {
                const [productsData, allStores] = await Promise.all([
                    getProductsByStoreService(id),
                    getStoresService()
                ]);
                setProducts(productsData);
                const currentStore = allStores.find((s: Store) => s.id === id);
                if (currentStore) setStoreName(currentStore.name);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, navigate]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const total = Math.round(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0));

    const handleFinalize = async (): Promise<void> => {
        const userId = localStorage.getItem('userId');

        if (!userId || !id) {
            alert("Error: Sesión no válida.");
            return;
        }

        if (!destination) {
            alert("Por favor, selecciona una ubicación de entrega en el mapa.");
            return;
        }

        if (cart.length === 0) {
            alert("El carrito está vacío.");
            return;
        }

        const orderData: CreateOrderDTO = {
            consumerid: userId,
            storeid: id,
            total: total,
            destination: destination,
            items: cart.map((item) => ({
                productid: item.id,
                quantity: item.quantity,
                priceattime: Math.round(item.price)
            }))
        };

        try {
            setLoading(true);
            await createOrderService(orderData);
            alert("¡Pedido realizado con éxito!");
            setCart([]);
            navigate('/my-orders');
        } catch (error: unknown) {
            let errorMessage = "Error interno del servidor (500)";
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || errorMessage;
            }
            alert(`No se pudo crear el pedido: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-6xl mx-auto px-6 py-10">
                <h2 className="text-2xl font-semibold text-gray-800 mb-10">
                    Menú / <span className="text-orange-500">{storeName}</span>
                </h2>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex justify-between">
                                Selecciona el punto de entrega
                                {destination && <span className="text-green-500 font-normal">📍 Ubicación fijada</span>}
                            </h3>
                            <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
                                <MapContainer 
                                    center={[3.4516, -76.5320]} 
                                    zoom={13} 
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <LocationSelector onLocationSelect={setDestination} position={destination} />
                                </MapContainer>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 italic">Haz clic en cualquier punto del mapa para definir dónde recibirás tu pedido.</p>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-gray-400 text-sm">Cargando menú...</p>
                            ) : (
                                products.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)
                            )}
                        </div>
                    </div>

                    <div className="lg:w-80 w-full">
                        <CartSidebar
                            cart={cart}
                            total={total}
                            onRemove={removeFromCart}
                            onFinalize={handleFinalize}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}