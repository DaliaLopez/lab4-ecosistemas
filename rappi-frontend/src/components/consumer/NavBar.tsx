import { useNavigate } from "react-router-dom";

export default function Navbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">

            <h2
                onClick={() => navigate('/browse')}
                className="text-xl font-semibold text-orange-500 cursor-pointer"
            >
                RappiLab <span className="text-xs bg-orange-100 px-2 py-1 rounded-lg ml-2 uppercase">Consumer</span>
            </h2>

            <div className="flex items-center gap-6">
                <button
                    onClick={() => navigate('/my-orders')}
                    className="text-sm text-gray-600 hover:text-orange-500 transition"
                >
                    Mis pedidos
                </button>

                <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-red-500 transition"
                >
                    Salir
                </button>
            </div>

        </nav>
    );
}