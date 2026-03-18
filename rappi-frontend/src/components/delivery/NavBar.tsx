import { useNavigate } from "react-router-dom";

export default function DeliveryNavbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            {/* Logo y Badge */}
            <h2
                onClick={() => navigate('/delivery/dashboard')}
                className="text-xl font-semibold text-orange-500 cursor-pointer flex items-center"
            >
                RappiLab 
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg ml-2 uppercase tracking-wider">
                    Repartidor
                </span>
            </h2>

            {/* Enlaces de Navegación */}
            <div className="flex items-center gap-6">
                <button
                    onClick={() => navigate('/delivery/dashboard')}
                    className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors"
                >
                    Disponibles
                </button>

                <button
                    onClick={() => navigate('/delivery/accepted-orders')}
                    className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors"
                >
                    Mis Pedidos
                </button>

                {/* Separador visual opcional */}
                <div className="h-4 w-px bg-gray-300"></div>

                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
                >
                    Salir
                </button>
            </div>
        </nav>
    );
}