"use client";

import { useState, useEffect } from 'react';

export default function BulkDeleteModal({ isOpen, onClose, selectedIds, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [canDelete, setCanDelete] = useState(false);

    useEffect(() => {
        let timer;
        if (isOpen) {
            setCountdown(5);
            setCanDelete(false);
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanDelete(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isOpen]);

    const handleDelete = async () => {
        if (!canDelete) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/products/bulk-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ ids: selectedIds })
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                alert(data.message || "Error al eliminar productos");
            }
        } catch (error) {
            console.error("Error deleting products:", error);
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all scale-100">
                <div className="p-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons text-red-600 dark:text-red-400 text-3xl">delete_sweep</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center mb-2">¿Eliminar {selectedIds.length} productos?</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
                        Esta acción es irreversible. Se eliminarán los productos seleccionados, su stock y precios asociados.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading || !canDelete}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${canDelete ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-gray-400 cursor-not-allowed'}`}
                        >
                            {loading ? (
                                <span className="material-icons animate-spin text-sm">autorenew</span>
                            ) : !canDelete ? (
                                <span className="text-sm">Esperar {countdown}s</span>
                            ) : (
                                <span className="material-icons text-sm">delete_forever</span>
                            )}
                            {canDelete && "Eliminar Todo"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
