"use client";

import Link from 'next/link';
import { useFavoritesStore } from '@/lib/store/useFavoritesStore';
import { useCartStore } from '@/lib/store/useCartStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function FavoritesPage() {
    const { items: favorites, toggleFavorite, isFavorite, clearFavorites } = useFavoritesStore();
    const { addToCart } = useCartStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen font-body flex flex-col">
                <Header />
                <main className="flex-1"></main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-text-light dark:text-text-dark font-body flex flex-col transition-colors duration-200">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                            <span className="material-icons text-2xl">favorite</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Mis Favoritos</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {favorites.length} {favorites.length === 1 ? 'producto guardado' : 'productos guardados'}
                            </p>
                        </div>
                    </div>

                    {favorites.length > 0 && (
                        <button
                            onClick={clearFavorites}
                            className="text-gray-500 hover:text-red-500 text-sm font-medium flex items-center gap-1 transition-colors bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500"
                        >
                            <span className="material-icons text-[18px]">delete_sweep</span>
                            Limpiar Lista
                        </button>
                    )}
                </div>

                {favorites.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center max-w-2xl mx-auto flex flex-col items-center">
                        <div className="w-24 h-24 mb-6 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                            <span className="material-icons text-gray-300 dark:text-gray-600" style={{ fontSize: '48px' }}>favorite_border</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-3">Tu lista de deseos está vacía</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                            Explora nuestro catálogo y guarda los productos que te interesen para comprarlos más tarde tocando el ícono de corazón.
                        </p>
                        <Link
                            href="/"
                            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-1 flex items-center gap-2"
                        >
                            <span className="material-icons">storefront</span>
                            Explorar Catálogo
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {favorites.map((product) => (
                            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group flex flex-col hover:-translate-y-1 duration-300 relative">
                                <Link href={`/product/${product.id}`} className="absolute inset-0 z-0"></Link>

                                <div className="relative aspect-square bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center p-4 z-10 pointer-events-none">
                                    {product.image_url ? (
                                        <img src={`http://localhost:3001${product.image_url}`} alt={product.model} className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <span className="material-icons text-gray-300 dark:text-gray-600 text-6xl">image_not_supported</span>
                                    )}
                                    {(() => {
                                        const s = product.stock_online;
                                        const qO = (s && typeof s.quantity === 'number') ? s.quantity : (typeof s === 'number' ? s : (product.stockOnline || 0));
                                        const qP = (product.stock_physical?.quantity || product.stock_physical || 0);
                                        if (qO === 0 && (typeof qP === 'number' ? qP : qP.quantity) === 0) {
                                            return <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">Sin Stock</span>;
                                        }
                                        return null;
                                    })()}
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFavorite(product);
                                    }}
                                    className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur text-red-500 hover:bg-white dark:hover:bg-gray-700 transition-all z-20 hover:scale-110 shadow-sm border border-gray-100 dark:border-gray-700"
                                    title="Quitar de Favoritos"
                                >
                                    <span className="material-icons text-[18px]">favorite</span>
                                </button>

                                <div className="p-4 flex-1 flex flex-col z-10 pointer-events-none">
                                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 uppercase tracking-wide font-bold">{product.category} • {product.brand}</p>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2 min-h-[40px] leading-tight text-sm sm:text-base">{product.model}</h3>
                                    <div className="mt-auto pointer-events-auto">
                                        <div className="flex items-end justify-between">
                                            <span className="text-lg sm:text-xl font-black text-primary">${Number(product.price).toLocaleString('es-AR')}</span>
                                            <button
                                                disabled={(() => {
                                                    const s = product.stock_online;
                                                    const q = (s && typeof s.quantity === 'number') ? s.quantity : (typeof s === 'number' ? s : (product.stockOnline || 0));
                                                    return q <= 0;
                                                })()}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    addToCart(product);
                                                }}
                                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-sm focus:outline-none ${(() => {
                                                    const s = product.stock_online;
                                                    const q = (s && typeof s.quantity === 'number') ? s.quantity : (typeof s === 'number' ? s : (product.stockOnline || 0));
                                                    return q <= 0
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                                        : 'bg-gray-100 hover:bg-primary hover:text-white dark:bg-gray-700 dark:hover:bg-primary text-gray-800 dark:text-white'
                                                })()} hover:scale-110`}
                                                title={(() => {
                                                    const s = product.stock_online;
                                                    const q = (s && typeof s.quantity === 'number') ? s.quantity : (typeof s === 'number' ? s : (product.stockOnline || 0));
                                                    return q <= 0 ? "Sin stock online" : "Añadir al carrito";
                                                })()}
                                            >
                                                <span className="material-icons text-sm sm:text-base">
                                                    {(() => {
                                                        const s = product.stock_online;
                                                        const q = (s && typeof s.quantity === 'number') ? s.quantity : (typeof s === 'number' ? s : (product.stockOnline || 0));
                                                        return q <= 0 ? 'block' : 'add_shopping_cart';
                                                    })()}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
