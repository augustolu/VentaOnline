import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function StockUpdateModal({ isOpen, onClose, product, onSuccess }) {
    const { token } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);
    const [stockOnline, setStockOnline] = useState(0);
    const [stockPhysical, setStockPhysical] = useState(0);

    // Precargar variables cuando el producto cambia
    useEffect(() => {
        if (product) {
            setStockOnline(product.stock_online?.quantity || 0);
            setStockPhysical(product.stock_physical?.quantity || 0);
        }
    }, [product]);

    if (!isOpen || !product) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch(`http://localhost:3001/api/products/${product.id}/stock`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    stock_online: Number(stockOnline),
                    stock_physical: Number(stockPhysical)
                })
            });

            const data = await res.json();
            if (data.success) {
                // Notificar re-fresh
                onSuccess(data.data);
                onClose();
            } else {
                alert(`Error al actualizar stock: ${data.message}`);
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al contactar con el servidor.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800 dark:text-gray-200">Ajuste de Stock</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-sm text-gray-500 mb-6 truncate"><span className="font-bold text-gray-700 dark:text-gray-300">{product.model}</span></p>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Stock Online */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 truncate">Stock Online (Web)</label>
                            <div className="relative">
                                <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-[18px]">language</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={stockOnline}
                                    onChange={(e) => setStockOnline(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Stock Fisico */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 truncate">Stock Físico (Local)</label>
                            <div className="relative">
                                <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-[18px]">storefront</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={stockPhysical}
                                    onChange={(e) => setStockPhysical(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold transition-all shadow-md flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isSaving ? (
                                <span className="material-icons animate-spin text-[18px]">autorenew</span>
                            ) : (
                                <span className="material-icons text-[18px]">save</span>
                            )}
                            Guardar Ajuste
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
