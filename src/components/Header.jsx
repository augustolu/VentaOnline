"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useCartStore } from '@/lib/store/useCartStore';

export default function Header() {
    const { isAdminOrEmployee, user, logout } = useAuthStore();
    const { items, getTotalItems, getTotalPrice, removeFromCart } = useCartStore();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const cartItemsCount = getTotalItems();
    const cartTotal = getTotalPrice();

    return (
        <>
            <div className="bg-primary text-white text-xs py-1">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center"><span className="material-icons text-sm mr-1">phone</span> +54 11 1234 5678</span>
                        <span className="flex items-center"><span className="material-icons text-sm mr-1">email</span> contacto@mitienda.com</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link className="hover:underline" href="#">Mi Cuenta</Link>
                        <Link className="hover:underline" href="#">Rastrear Pedido</Link>
                        <span className="cursor-pointer">ARS $</span>
                    </div>
                </div>
            </div>

            <header className="bg-surface-light dark:bg-surface-dark shadow-sm sticky top-0 z-40 transition-colors duration-200">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link className="flex items-center gap-3" href="/">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 flex-shrink-0">
                            <span className="material-icons text-gray-400">store</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-primary leading-none tracking-tight">Tu</span>
                            <span className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-none">Tienda</span>
                        </div>
                    </Link>
                    <div className="flex-1 max-w-2xl mx-8 hidden md:block">
                        <div className="relative">
                            <input className="w-full border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-full py-2.5 pl-5 pr-12 focus:outline-none focus:border-primary focus:ring-0 text-sm transition-colors" placeholder="Buscar repuestos, herramientas..." type="text" />
                            <button className="absolute right-0 top-0 h-full w-12 flex items-center justify-center bg-primary text-white rounded-r-full hover:bg-primary-hover transition-colors">
                                <span className="material-icons">search</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-300">
                        {user ? (
                            <div className="relative pr-4 border-r border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center gap-3 hover:text-primary transition-colors focus:outline-none"
                                >
                                    <span className="material-icons text-3xl">account_circle</span>
                                    <div className="hidden lg:flex flex-col text-xs items-start">
                                        <span className="font-bold text-gray-800 dark:text-white line-clamp-1 w-24 text-left" title={user.first_name}>
                                            {user.first_name}
                                        </span>
                                        <span className="text-gray-500 text-[10px] uppercase tracking-wide flex items-center gap-1 mt-0.5">
                                            Mi Cuenta <span className="material-icons text-[10px]">expand_more</span>
                                        </span>
                                    </div>
                                </button>

                                {isProfileMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
                                        <div className="absolute right-4 top-full mt-3 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{user.first_name} {user.last_name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                <Link href="#" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full text-left">
                                                    <span className="material-icons text-[18px]">person</span> Mi Perfil
                                                </Link>
                                                <Link href="#" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-full text-left">
                                                    <span className="material-icons text-[18px]">favorite_border</span> Favoritos
                                                </Link>

                                                {isAdminOrEmployee() && (
                                                    <Link href="/dashboard" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-primary font-bold hover:bg-primary/10 rounded-lg transition-colors w-full text-left">
                                                        <span className="material-icons text-[18px]">dashboard</span> Panel de Control
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                                                <button onClick={() => { setIsProfileMenuOpen(false); logout(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full text-left font-medium">
                                                    <span className="material-icons text-[18px]">logout</span> Cerrar Sesión
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="flex items-center gap-2 hover:text-primary transition-colors group cursor-pointer pr-4 border-r border-gray-200 dark:border-gray-700">
                                <span className="material-icons text-3xl group-hover:scale-110 transition-transform">account_circle</span>
                                <div className="hidden lg:flex flex-col text-xs items-start">
                                    <span className="font-bold text-gray-800 dark:text-white">Ingresar</span>
                                    <span className="text-gray-400">o Registrarse</span>
                                </div>
                            </Link>
                        )}

                        <button className="relative hover:text-primary transition-colors">
                            <span className="material-icons text-3xl">favorite_border</span>
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setIsCartOpen(!isCartOpen)}
                                className="relative hover:text-primary transition-colors flex items-center gap-2 focus:outline-none"
                            >
                                <div className="relative">
                                    <span className="material-icons text-3xl">shopping_cart</span>
                                    {cartItemsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {cartItemsCount}
                                        </span>
                                    )}
                                </div>
                                <div className="hidden lg:flex flex-col text-xs items-start">
                                    <span className="text-gray-400">Total</span>
                                    <span className="font-bold text-gray-800 dark:text-white leading-none">
                                        ${Number(cartTotal).toLocaleString('es-AR')}
                                    </span>
                                </div>
                                <span className={`material-icons text-sm transition-transform ${isCartOpen ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>

                            {isCartOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsCartOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 flex flex-col">
                                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                            <h3 className="font-bold text-gray-800 dark:text-gray-200">Mi Carrito ({cartItemsCount})</h3>
                                            <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                                <span className="material-icons text-sm">close</span>
                                            </button>
                                        </div>

                                        {items.length === 0 ? (
                                            <div className="p-8 text-center flex flex-col items-center">
                                                <span className="material-icons text-4xl text-gray-300 dark:text-gray-600 mb-2">remove_shopping_cart</span>
                                                <p className="text-gray-500 text-sm">Tu carrito está vacío</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-[320px] overflow-y-auto p-4 space-y-4">
                                                {items.map((item) => (
                                                    <div key={item.product.id} className="flex gap-4 items-center group">
                                                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex shrink-0">
                                                            {item.product.image_url ? (
                                                                <img src={`http://localhost:3001${item.product.image_url}`} alt={item.product.model} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                                                            ) : (
                                                                <span className="material-icons text-gray-400 m-auto">image</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <Link href={`/product/${item.product.id}`} onClick={() => setIsCartOpen(false)}>
                                                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate hover:text-primary transition-colors">{item.product.model}</h4>
                                                            </Link>
                                                            <p className="text-xs text-gray-500">{item.product.brand}</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-sm font-black text-primary">${Number(item.product.price).toLocaleString('es-AR')}</span>
                                                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-0.5">
                                                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">x{item.quantity}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.product.id)}
                                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                                                            title="Eliminar"
                                                        >
                                                            <span className="material-icons text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {items.length > 0 && (
                                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-gray-600 dark:text-gray-300 font-bold">Total:</span>
                                                    <span className="text-xl font-black text-primary">${Number(cartTotal).toLocaleString('es-AR')}</span>
                                                </div>
                                                <button className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/30 transition-all flex justify-center items-center gap-2">
                                                    <span className="material-icons text-sm">lock</span> Ir a Pagar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <nav className="border-t border-gray-100 dark:border-gray-800 hidden md:block">
                    <div className="container mx-auto px-4">
                        <ul className="flex space-x-8 text-sm font-bold text-gray-600 dark:text-gray-300">
                            <li><Link href="/" className="block py-3 hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors">Inicio</Link></li>
                            <li className="relative group">
                                <button className="flex items-center gap-1 py-3 group-hover:text-primary border-b-2 border-transparent group-hover:border-primary transition-colors focus:outline-none">
                                    Categorías <span className="material-icons text-sm transition-transform group-hover:rotate-180">expand_more</span>
                                </button>
                                <div className="absolute top-full left-0 w-64 bg-white dark:bg-gray-800 shadow-xl rounded-b-lg border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform origin-top scale-95 group-hover:scale-100">
                                    <ul className="py-2">
                                        <li><Link href="#" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors">Repuestos Celulares</Link></li>
                                        <li><Link href="#" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors">Módulos y Pantallas</Link></li>
                                        <li><Link href="#" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors">Baterías</Link></li>
                                        <li><Link href="#" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors">Herramientas</Link></li>
                                        <li><Link href="#" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary transition-colors">Insumos Técnicos</Link></li>
                                    </ul>
                                </div>
                            </li>
                            <li><Link href="#" className="block py-3 hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors">Ofertas</Link></li>
                            <li><Link href="#" className="block py-3 hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors">Nuevos Ingresos</Link></li>
                            <li><Link href="#" className="block py-3 text-secondary font-black border-b-2 border-transparent hover:border-secondary transition-colors">Cuenta Gremio</Link></li>
                            <li><Link href="#" className="block py-3 hover:text-primary border-b-2 border-transparent hover:border-primary transition-colors">Contacto</Link></li>
                        </ul>
                    </div>
                </nav>
            </header>
        </>
    );
}
