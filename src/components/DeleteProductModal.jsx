import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function DeleteProductModal({ isOpen, onClose, product, onSuccess }) {
    const { token, isAdminOrEmployee } = useAuthStore();
    const isPowerfulUser = isAdminOrEmployee();
    const [isDeleting, setIsDeleting] = useState(false);
    const [countdown, setCountdown] = useState(isPowerfulUser ? 0 : 5);

    useEffect(() => {
        let timer;
        if (isOpen && product) {
            setCountdown(isPowerfulUser ? 0 : 5); // Reset al abrir
            if (!isPowerfulUser) {
                timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } else {
            setCountdown(isPowerfulUser ? 0 : 5); // Reset si se cierra sin borrar
        }

        return () => clearInterval(timer);
    }, [isOpen, product, isPowerfulUser]);

    if (!isOpen || !product) return null;

    const handleDelete = async () => {
        if (countdown > 0) return; // Doble validación por seguridad
        setIsDeleting(true);

        try {
            const res = await fetch(`http://localhost:3001/api/products/${product.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                onSuccess(product.id);
                onClose();
            } else {
                const data = await res.json();
                alert(`Error al eliminar: ${data.message || 'Desconocido'}`);
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al contactar con el servidor.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden border border-red-100 dark:border-red-900/50">
                <div className="bg-red-500 border-b border-red-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="font-bold flex items-center gap-2">
                        <span className="material-icons">warning</span>
                        Confirmar Eliminación
                    </h2>
                    <button onClick={onClose} className="text-red-100 hover:text-white transition-colors">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                        ¿Estás absolutamente seguro de que deseas eliminar este producto permanentemente de la base de datos?
                    </p>

                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 flex items-center gap-3">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.model} className="w-12 h-12 object-contain bg-white rounded shadow-sm border border-red-100" />
                        ) : (
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center shadow-sm">
                                <span className="material-icons text-gray-400">image</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{product.model}</h3>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-lg font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            disabled={countdown > 0 || isDeleting}
                            onClick={handleDelete}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-white transition-all shadow-md ${countdown > 0
                                ? 'bg-red-300 cursor-not-allowed opacity-80'
                                : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                                }`}
                        >
                            {isDeleting ? (
                                <span className="material-icons animate-spin text-[18px]">autorenew</span>
                            ) : countdown > 0 ? (
                                <span>Esperar... ({countdown})</span>
                            ) : (
                                <>
                                    <span className="material-icons text-[18px]">delete_forever</span>
                                    Eliminar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
