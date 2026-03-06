"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const { isAuthenticated, isAdminOrEmployee, logout, user } = useAuthStore();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (!isAuthenticated()) {
            router.push('/login');
        } else if (!isAdminOrEmployee()) {
            router.push('/');
        }
    }, [isAuthenticated, isAdminOrEmployee, router]);

    if (!isClient || !isAuthenticated() || !isAdminOrEmployee()) {
        return <div className="min-h-screen flex text-white items-center justify-center p-8 bg-gray-900">Validando accesos...</div>;
    }

    return (
        <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary/10">
                    <h2 className="text-lg font-black text-primary">Panel de Control</h2>
                    <p className="text-xs text-gray-500">[{user?.role?.name}] {user?.first_name}</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {user?.role?.name === 'Admin' && (
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 bg-primary text-white rounded-lg">
                            <span className="material-icons text-sm">dashboard</span> Vista General
                        </Link>
                    )}

                    <Link href="/dashboard/products" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${user?.role?.name !== 'Admin' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <span className="material-icons text-sm">inventory_2</span> Productos
                    </Link>

                    <Link href="/dashboard/orders" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <span className="material-icons text-sm">shopping_bag</span> Pedidos
                    </Link>

                    {user?.role?.name === 'Admin' && (
                        <>
                            <Link href="/dashboard/users" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <span className="material-icons text-sm">group</span> Usuarios
                            </Link>
                            <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <span className="material-icons text-sm">settings</span> Ajustes
                            </Link>
                        </>
                    )}
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link href="/" className="flex items-center justify-center gap-2 mb-3 px-3 py-2 w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors font-bold text-sm">
                        <span className="material-icons text-sm">storefront</span> Ir a la Tienda
                    </Link>
                    <button
                        onClick={() => { logout(); router.push('/'); }}
                        className="flex items-center gap-3 px-3 py-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <span className="material-icons text-sm">logout</span> Salir
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center md:hidden">
                    <h2 className="text-lg font-black text-primary">Panel de Control</h2>
                    <div className="flex gap-2">
                        <Link href="/" className="material-icons text-gray-600 bg-gray-100 p-1 rounded">storefront</Link>
                        <button className="material-icons text-gray-500 p-1">menu</button>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
