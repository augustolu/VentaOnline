import React, { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function PhysicalSaleModal({ isOpen, onClose, product, onSuccess }) {
    const { token } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState("Efectivo");

    if (!isOpen || !product) return null;

    const availableStock = product.stock_physical?.quantity || 0;
    const isOutOfStock = availableStock < 1;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (quantity > availableStock) {
            return alert(`Stock físico insuficiente. Solo quedan ${availableStock} unidades.`);
        }

        setIsSaving(true);
        try {
            const res = await fetch(`http://localhost:3001/api/products/${product.id}/sale`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    quantity: Number(quantity),
                    payment_method: paymentMethod
                })
            });

            const data = await res.json();
            if (data.success) {
                // El endpoint devuelve un objeto con { sale, updatedStock }.
                // Informamos a la capa superior (page.jsx) que debe recargar el fetch local
                onSuccess();
                onClose();
                // Opcional: Mostrar Toast de éxito
            } else {
                alert(`Error al registrar venta: ${data.message}`);
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al contactar con el servidor.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="bg-emerald-500 border-b border-emerald-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="font-bold flex items-center gap-2">
                        <span className="material-icons">point_of_sale</span>
                        Nueva Venta (Mostrador)
                    </h2>
                    <button onClick={onClose} className="text-emerald-100 hover:text-white transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6 flex gap-3 items-start bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.model} className="w-12 h-12 object-contain bg-white rounded shadow-sm border border-emerald-100" />
                        ) : (
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center shadow-sm">
                                <span className="material-icons text-gray-400">image</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{product.model}</h3>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">${Number(product.price).toLocaleString('es-AR')}</p>
                        </div>
                    </div>

                    {isOutOfStock ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200 flex items-center gap-2">
                            <span className="material-icons">error_outline</span>
                            No hay Stock Físico para vender este ítem.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 truncate">Cantidad Disp. ({availableStock})</label>
                                    <div className="flex items-center">
                                        <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 border-r-0 text-gray-700 dark:text-gray-300">
                                            <span className="material-icons text-sm">remove</span>
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={availableStock}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="w-full border-y border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                                        />
                                        <button type="button" onClick={() => setQuantity(Math.min(availableStock, quantity + 1))} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-2 rounded-r-lg border border-gray-300 dark:border-gray-600 border-l-0 text-gray-700 dark:text-gray-300">
                                            <span className="material-icons text-sm">add</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Método de Pago</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="Efectivo">💵 Efectivo</option>
                                        <option value="MercadoPago">💳 MercadoPago</option>
                                        <option value="Transferencia">🏦 Transferencia</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg flex justify-between items-center border border-gray-100 dark:border-gray-700 mt-6">
                                <span className="text-gray-500 font-bold">Cobro Total:</span>
                                <span className="text-2xl font-black text-gray-800 dark:text-white">${(Number(product.price) * quantity).toLocaleString('es-AR')}</span>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-bold transition-all shadow-md shadow-emerald-500/30 flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {isSaving ? (
                                        <span className="material-icons animate-spin text-[18px]">autorenew</span>
                                    ) : (
                                        <span className="material-icons text-[18px]">check_circle</span>
                                    )}
                                    Confirmar Venta
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
