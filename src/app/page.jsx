"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useCartStore } from '@/lib/store/useCartStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AddProductModal from '@/components/AddProductModal';

export default function HomePage() {
    const { isAdminOrEmployee, user, logout } = useAuthStore();
    const { addToCart } = useCartStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // Products State
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/products');
                const data = await res.json();
                if (data.success) {
                    setProducts(data.data);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body transition-colors duration-200">
            <Header />

            <div className="md:hidden bg-surface-light dark:bg-surface-dark p-4 border-t border-gray-100 dark:border-gray-700">
                <div className="relative">
                    <input className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-primary" placeholder="Buscar..." type="text" />
                    <span className="material-icons absolute right-3 top-2.5 text-gray-400">search</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 flex gap-6">
                <aside className="w-64 hidden lg:block flex-shrink-0">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">

                        {isAdminOrEmployee() && (
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 px-4 rounded-lg text-sm font-bold transition-all shadow-sm group"
                                >
                                    <span className="material-icons group-hover:rotate-90 transition-transform">add_circle</span>
                                    Agregar Producto
                                </button>
                            </div>
                        )}

                        <div className="bg-primary px-4 py-3 flex items-center gap-2">
                            <span className="material-icons text-white">menu</span>
                            <h3 className="font-bold text-white uppercase text-sm tracking-wide">Categorías</h3>
                        </div>
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            <li>
                                <a className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium" href="#">
                                    <div className="flex items-center gap-3">
                                        <span className="material-icons text-gray-400 group-hover:text-primary text-lg">headphones</span>
                                        <span>Tecnología y Audio</span>
                                    </div>
                                    <span className="material-icons text-gray-300 text-sm">chevron_right</span>
                                </a>
                            </li>
                            <li>
                                <a className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium" href="#">
                                    <div className="flex items-center gap-3">
                                        <span className="material-icons text-gray-400 group-hover:text-primary text-lg">computer</span>
                                        <span>Periféricos y Comp.</span>
                                    </div>
                                    <span className="material-icons text-gray-300 text-sm">chevron_right</span>
                                </a>
                            </li>
                            <li>
                                <a className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium" href="#">
                                    <div className="flex items-center gap-3">
                                        <span className="material-icons text-gray-400 group-hover:text-primary text-lg">blender</span>
                                        <span>Pequeños Electrodomésticos</span>
                                    </div>
                                    <span className="material-icons text-gray-300 text-sm">chevron_right</span>
                                </a>
                            </li>
                            <li>
                                <a className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium" href="#">
                                    <div className="flex items-center gap-3">
                                        <span className="material-icons text-gray-400 group-hover:text-primary text-lg">cable</span>
                                        <span>Accesorios de Celular</span>
                                    </div>
                                    <span className="material-icons text-gray-300 text-sm">chevron_right</span>
                                </a>
                            </li>
                            <li>
                                <a className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium" href="#">
                                    <div className="flex items-center gap-3">
                                        <span className="material-icons text-gray-400 group-hover:text-primary text-lg">store</span>
                                        <span>Mayorista</span>
                                    </div>
                                    <span className="material-icons text-gray-300 text-sm">chevron_right</span>
                                </a>
                            </li>
                            <li>
                                <a className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium" href="#">
                                    <div className="flex items-center gap-3">
                                        <span className="material-icons text-gray-400 group-hover:text-primary text-lg">local_offer</span>
                                        <span className="text-secondary dark:text-red-400 font-bold">Ofertas</span>
                                    </div>
                                    <span className="material-icons text-gray-300 text-sm">chevron_right</span>
                                </a>
                            </li>
                        </ul>
                    </div>


                </aside>
                <main className="flex-1 min-w-0">
                    <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-md mb-8 h-64 md:h-80 lg:h-96 group">
                        <img alt="Tech repair station" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" src="/hero-repair.png" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent flex items-center">
                            <div className="px-8 md:px-12 max-w-xl">
                                <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded mb-4 inline-block uppercase tracking-wider">Servicio Oficial</span>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight drop-shadow-md">
                                    REPARACIONES <span className="text-primary">RÁPIDAS</span> Y <br />REPUESTOS ORIGINALES
                                </h1>
                                <p className="text-gray-200 font-medium mb-8 text-sm md:text-base drop-shadow-sm">Encontrá todo lo que necesitás para reparar tu equipo o traelo a nuestros expertos.</p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-1"
                                    >
                                        Ver Productos
                                    </button>
                                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-lg border border-white/30 transition-all">
                                        Contactar Técnico
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <span className="material-icons text-primary text-3xl">local_shipping</span>
                            <div>
                                <h4 className="font-bold text-sm">Envío Gratis</h4>
                                <p className="text-xs text-gray-500">En compras &gt; $50k</p>
                            </div>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <span className="material-icons text-primary text-3xl">verified</span>
                            <div>
                                <h4 className="font-bold text-sm">Garantía</h4>
                                <p className="text-xs text-gray-500">12 meses oficial</p>
                            </div>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <span className="material-icons text-primary text-3xl">credit_card</span>
                            <div>
                                <h4 className="font-bold text-sm">Cuotas</h4>
                                <p className="text-xs text-gray-500">3 y 6 sin interés</p>
                            </div>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <span className="material-icons text-primary text-3xl">support_agent</span>
                            <div>
                                <h4 className="font-bold text-sm">Soporte 24/7</h4>
                                <p className="text-xs text-gray-500">Online siempre</p>
                            </div>
                        </div>
                    </div>

                    <div id="productos" className="flex items-center justify-between mb-6 scroll-mt-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                            Nuestros Productos
                        </h2>
                    </div>

                    {loadingProducts ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[300px] flex items-center justify-center mb-8">
                            <div className="flex flex-col items-center gap-2">
                                <span className="material-icons animate-spin text-4xl text-primary">autorenew</span>
                                <span className="text-sm text-gray-500">Cargando catálogo...</span>
                            </div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[300px] flex items-center justify-center mb-8">
                            <div className="text-center">
                                <span className="material-icons text-gray-300 dark:text-gray-600 text-6xl mb-4">inventory_2</span>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Aún no hay productos disponibles.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                            {products.map(product => (
                                <Link
                                    key={product.id}
                                    href={`/product/${product.id}`}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group flex flex-col hover:-translate-y-1 duration-300 block"
                                >
                                    <div className="relative aspect-square bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center p-4">
                                        {product.image_url ? (
                                            <img src={`http://localhost:3001${product.image_url}`} alt={product.model} className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <span className="material-icons text-gray-300 dark:text-gray-600 text-6xl">image_not_supported</span>
                                        )}
                                        {product.stock_online === 0 && product.stock_physical === 0 && (
                                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">Sin Stock</span>
                                        )}
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 uppercase tracking-wide font-bold">{product.category} • {product.brand}</p>
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2 min-h-[40px] leading-tight text-sm sm:text-base">{product.model}</h3>
                                        {product.compatibility && (
                                            <p className="text-[10px] sm:text-xs text-gray-500 mb-3 line-clamp-1 italic bg-gray-50 dark:bg-gray-700/50 inline-block px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">Para: {product.compatibility}</p>
                                        )}
                                        <div className="mt-auto">
                                            <div className="flex items-end justify-between">
                                                <span className="text-lg sm:text-xl font-black text-primary">${Number(product.price).toLocaleString('es-AR')}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        addToCart(product);
                                                    }}
                                                    className="bg-gray-100 hover:bg-primary hover:text-white dark:bg-gray-700 dark:hover:bg-primary text-gray-800 dark:text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-sm focus:outline-none"
                                                    title="Añadir al carrito"
                                                >
                                                    <span className="material-icons text-sm sm:text-base">add_shopping_cart</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {(!user || user.role?.name !== 'Wholesaler') && (
                        <div className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                            <div className="relative z-10 max-w-2xl">
                                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block tracking-wider uppercase shadow-sm">
                                    Nuevo Programa
                                </span>
                                <h3 className="text-3xl font-black text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                    ¿Querés ser <span className="text-primary">Mayorista?</span>
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 text-base md:text-lg">
                                    Registrate ahora y accedé a una lista de precios exclusiva orientada a revendedores y comercios. Disfrutá de descuentos por volumen.
                                </p>
                                <Link href="/register?type=wholesaler" className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-gray-900/40 flex items-center gap-2 w-max">
                                    <span className="material-icons">storefront</span>
                                    Solicitar Cuenta Mayorista
                                </Link>
                            </div>
                            <div className="hidden md:block absolute right-[-20px] bottom-[-40px] opacity-10 dark:opacity-20 group-hover:scale-110 transition-transform duration-700">
                                <span className="material-icons" style={{ fontSize: '240px' }}>storefront</span>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <div className="fixed bottom-6 right-6 z-50">
                <button className="bg-secondary hover:bg-gray-800 text-white rounded-full p-4 shadow-lg shadow-gray-500/40 flex items-center gap-2 transition-all hover:scale-105 group">
                    <span className="material-icons text-2xl animate-pulse">chat</span>
                    <span className="font-bold pr-2 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Asistente Virtual</span>
                </button>
            </div>

            <Footer />

            <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </div>
    );
}
