"use client";

import { useState } from 'react';

export default function BulkPriceEditModal({ isOpen, onClose, selectedIds, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('percentage'); // 'percentage', 'fixed', 'amount'
    const [value, setValue] = useState('');

    const handleUpdate = async () => {
        if (!value) return alert("Ingresa un valor");

        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/products/bulk-price', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ids: selectedIds,
                    update: { type, value: Number(value) }
                })
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                alert(data.message || "Error al actualizar precios");
            }
        } catch (error) {
            console.error("Error updating prices:", error);
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
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons text-blue-600 dark:text-blue-400 text-3xl">sell</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center mb-2">Editar precio ({selectedIds.length} productos)</h2>

                    <div className="space-y-4 my-6">
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                            <button
                                onClick={() => setType('percentage')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'percentage' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500'}`}
                            >
                                Porcentaje (%)
                            </button>
                            <button
                                onClick={() => setType('amount')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'amount' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500'}`}
                            >
                                Monto ($)
                            </button>
                            <button
                                onClick={() => setType('fixed')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'fixed' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500'}`}
                            >
                                Precio Fijo
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">
                                {type === 'percentage' ? 'Aumento/Descuento (%)' : type === 'amount' ? 'Sumar/Restar ($)' : 'Nuevo Precio Final'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                    {type === 'percentage' ? '%' : '$'}
                                </span>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={type === 'percentage' ? "Ej: 10 o -15" : "Ej: 500 o -200"}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800 dark:text-gray-200"
                                />
                            </div>
                            <p className="mt-2 text-[10px] text-gray-500 px-1">
                                {type === 'percentage' && "Usa valores negativos para descontar (ej: -10)."}
                                {type === 'amount' && "Usa valores negativos para restar al precio actual."}
                                {type === 'fixed' && "Se establecerá este precio exacto a todos los seleccionados."}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="material-icons animate-spin text-sm">autorenew</span>
                            ) : (
                                <span className="material-icons text-sm">done_all</span>
                            )}
                            Aplicar Cambio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
