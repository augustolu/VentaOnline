"use client";

import { useAuthStore } from '@/lib/store/useAuthStore';

export default function ProductsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100">Gestión de Productos</h1>
            <p className="text-gray-500 dark:text-gray-400">Agrega nuevo stock o ajusta precios de los productos existentes.</p>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[400px] flex items-center justify-center">
                <p className="text-gray-400 text-center">La funcionalidad de Gestión de Productos estará disponible pronto.</p>
            </div>
        </div>
    );
}
