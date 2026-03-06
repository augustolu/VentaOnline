"use client";

import { useAuthStore } from '@/lib/store/useAuthStore';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuthStore();

    if (!user) return null;

    if (user.role?.name === 'Employee') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">¡Hola, {user.first_name}!</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Selecciona una de las herramientas a continuación para comenzar tu turno.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/dashboard/products" className="group p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 flex items-start gap-4 hover:shadow-md transition-all">
                            <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-lg group-hover:scale-110 transition-transform">
                                <span className="material-icons text-blue-600 dark:text-blue-300">inventory_2</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-200">Gestión de Stock</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Revisá y actualizá el inventario, agregá nuevos productos y ajustá precios.</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/orders" className="group p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50 flex items-start gap-4 hover:shadow-md transition-all">
                            <div className="bg-purple-100 dark:bg-purple-800 p-3 rounded-lg group-hover:scale-110 transition-transform">
                                <span className="material-icons text-purple-600 dark:text-purple-300">shopping_bag</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-200">Revisión de Pedidos</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestioná las ventas, revisá comprobantes y empacá los pedidos en cola.</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100">Panel General (Admin)</h1>
            <p className="text-gray-500 dark:text-gray-400">¡Bienvenido de nuevo, {user.first_name}! Aquí tienes un resumen de la tienda.</p>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Ventas Totales</h3>
                        <span className="material-icons text-primary bg-primary/10 p-2 rounded-lg">payments</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">$0,00</p>
                    <span className="text-xs text-green-500 font-medium">+0% vs mes pasado</span>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pedidos Nuevos</h3>
                        <span className="material-icons text-blue-500 bg-blue-500/10 p-2 rounded-lg">shopping_cart</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">0</p>
                    <span className="text-xs text-gray-400 font-medium">Pendientes de envío</span>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Productos Activos</h3>
                        <span className="material-icons text-orange-500 bg-orange-500/10 p-2 rounded-lg">inventory_2</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">0</p>
                    <span className="text-xs text-red-500 font-medium">0 sin stock</span>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Nuevos Clientes</h3>
                        <span className="material-icons text-purple-500 bg-purple-500/10 p-2 rounded-lg">group_add</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">0</p>
                    <span className="text-xs text-green-500 font-medium">Esta semana</span>
                </div>
            </div>

            {/* Quick Actions / Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Últimos Pedidos</h3>
                    <div className="flex items-center justify-center h-48 sm:bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-gray-400 text-sm">No hay pedidos recientes.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Alertas de Stock</h3>
                    <div className="flex items-center justify-center h-48 sm:bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-dashed border-orange-200 dark:border-orange-800/50">
                        <p className="text-orange-400 text-sm">El inventario está estable por ahora.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
