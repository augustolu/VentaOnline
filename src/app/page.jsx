"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useCartStore } from '@/lib/store/useCartStore';
import { useFavoritesStore } from '@/lib/store/useFavoritesStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AddProductModal from '@/components/AddProductModal';
import EditProductModal from '@/components/EditProductModal';
import BulkProductUploadModal from '@/components/BulkProductUploadModal';
import StockUpdateModal from '@/components/StockUpdateModal';
import PhysicalSaleModal from '@/components/PhysicalSaleModal';
import DeleteProductModal from '@/components/DeleteProductModal';
import BulkDeleteModal from '@/components/BulkDeleteModal';
import BulkPriceEditModal from '@/components/BulkPriceEditModal';
import { useSearchStore } from '@/lib/store/useSearchStore';

export default function HomePage() {
    const { isAdminOrEmployee, isAdmin, user, logout } = useAuthStore();
    const { searchQuery, setSearchQuery } = useSearchStore();
    const { addToCart } = useCartStore();
    const { toggleFavorite, isFavorite } = useFavoritesStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // States Modales Administrativos
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAdminProduct, setSelectedAdminProduct] = useState(null);

    // Bulk Actions State
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHeroHovered, setIsHeroHovered] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Products State
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const fetchProducts = async () => {
        setLoadingProducts(true);
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

    useEffect(() => {
        setIsMounted(true);
        fetchProducts();

        let lastMouseY = 0;

        const updateVisibilityState = (mouseY) => {
            const isScrollDown = window.scrollY > 50;
            const isMouseDown = mouseY > window.innerHeight / 2.5; // Un poco más arriba de la mitad
            setIsScrolled(isScrollDown || isMouseDown);
        };

        const handleScroll = () => {
            updateVisibilityState(lastMouseY);
        };

        const handleMouseMove = (e) => {
            lastMouseY = e.clientY;
            updateVisibilityState(lastMouseY);
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Funciones Administrativas
    const openStockModal = (product) => {
        setSelectedAdminProduct(product);
        setIsStockModalOpen(true);
    };

    const openSaleModal = (product) => {
        setSelectedAdminProduct(product);
        setIsSaleModalOpen(true);
    };

    const openDeleteModal = (product) => {
        setSelectedAdminProduct(product);
        setIsDeleteModalOpen(true);
    };

    const openEditModal = (product) => {
        setSelectedAdminProduct(product);
        setIsEditModalOpen(true);
    };

    const toggleProductSelection = (id) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const clearSelection = () => setSelectedProductIds([]);

    const filteredProducts = products.filter(p => {
        let match = true;

        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const brandMatch = p.brand?.toLowerCase().includes(q) || false;
            const modelMatch = p.model?.toLowerCase().includes(q) || false;
            if (!brandMatch && !modelMatch) match = false;
        }

        if (match && selectedCategory) {
            const isOfferMatch = selectedCategory === "Ofertas" && p.price < 50000;
            const isCategoryMatch = Array.isArray(p.category) ? p.category.includes(selectedCategory) : p.category === selectedCategory;

            if (!isOfferMatch && !isCategoryMatch) match = false;
        }

        return match;
    });

    if (!isMounted) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen font-body flex flex-col">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center p-12">
                    <span className="material-icons animate-spin text-4xl text-primary">autorenew</span>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body transition-colors duration-200">
            <Header />

            <div className="md:hidden bg-surface-light dark:bg-surface-dark p-4 border-t border-gray-100 dark:border-gray-700">
                <div className="relative">
                    <input
                        className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-primary"
                        placeholder="Buscar repuestos..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="material-icons absolute right-3 top-2.5 text-gray-400">search</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 flex gap-6 relative items-start">
                <aside className="w-64 hidden lg:block flex-shrink-0 sticky top-10 h-fit z-20">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">

                        {isAdminOrEmployee() && (
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-2">
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 px-4 rounded-lg text-sm font-bold transition-all shadow-sm group"
                                >
                                    <span className="material-icons group-hover:rotate-90 transition-transform">add_circle</span>
                                    Agregar Producto
                                </button>
                                {isAdmin() && (
                                    <button
                                        onClick={() => setIsBulkModalOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-sm group"
                                    >
                                        <span className="material-icons text-[16px] group-hover:-translate-y-1 transition-transform">cloud_upload</span>
                                        Carga Masiva (Excel)
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="bg-primary px-4 py-3 flex items-center gap-2">
                            <span className="material-icons text-white">menu</span>
                            <h3 className="font-bold text-white uppercase text-sm tracking-wide">Categorías</h3>
                        </div>
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            <li>
                                <button onClick={() => setSelectedCategory(null)} className={`w-full group flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium ${selectedCategory === null ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`material-icons text-lg ${selectedCategory === null ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`}>widgets</span>
                                        <span className={`text-left line-clamp-2 ${selectedCategory === null ? 'font-bold text-primary' : ''}`}>Todas las categorías</span>
                                    </div>
                                    <span className={`material-icons text-sm flex-shrink-0 ${selectedCategory === null ? 'text-primary' : 'text-gray-300'}`}>chevron_right</span>
                                </button>
                            </li>
                            {[
                                { name: "Tecnología y Audio", icon: "headphones" },
                                { name: "Periféricos y Computación", label: "Periféricos y Comp.", icon: "computer" },
                                { name: "Pequeños Electrodomésticos", icon: "blender" },
                                { name: "Accesorios de Celular", icon: "cable" },
                                { name: "Teléfonos", icon: "smartphone" },
                                { name: "Ofertas", icon: "local_offer", isOffer: true }
                            ].map(cat => (
                                <li key={cat.name}>
                                    <button onClick={() => setSelectedCategory(cat.name)} className={`w-full group flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium ${selectedCategory === cat.name ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`material-icons text-lg flex-shrink-0 ${selectedCategory === cat.name ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`}>{cat.icon}</span>
                                            <span className={`text-left ${cat.isOffer ? 'text-secondary dark:text-red-400 font-bold' : ''} ${selectedCategory === cat.name && !cat.isOffer ? 'font-bold text-primary' : ''}`}>
                                                {cat.label || cat.name}
                                            </span>
                                        </div>
                                        <span className={`material-icons text-sm flex-shrink-0 ml-2 ${selectedCategory === cat.name ? 'text-primary' : 'text-gray-300'}`}>chevron_right</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>


                </aside>
                <main className="flex-1 min-w-0">
                    <div
                        onMouseEnter={() => setIsHeroHovered(true)}
                        onMouseLeave={() => setIsHeroHovered(false)}
                        className={`relative bg-gray-950 rounded-[2rem] overflow-hidden shadow-xl mb-8 group flex flex-col justify-center transition-all duration-500 ease-in-out ${isScrolled && !isHeroHovered ? 'min-h-[120px] md:min-h-[140px]' : 'min-h-[300px] md:min-h-[380px] py-10'}`}
                    >
                        <img alt="Tech repair station" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700 mix-blend-overlay" src="/hero-repair.png" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                        <div className={`relative z-10 px-8 md:px-12 max-w-2xl w-full transition-all duration-500 ease-in-out ${isScrolled && !isHeroHovered ? 'py-6 md:py-8' : 'py-10 md:py-14'}`}>
                            <div className={`flex items-center gap-4 transition-all duration-500 ease-in-out ${isScrolled && !isHeroHovered ? 'mb-2 opacity-0 h-0 overflow-hidden' : 'mb-4 opacity-100'}`}>
                                <span className="bg-slate-700/50 border border-slate-600 text-slate-200 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded inline-block uppercase tracking-wider backdrop-blur-sm">Servicio Oficial</span>
                            </div>
                            <h1 className={`font-black text-white leading-[1.1] tracking-tight transition-all duration-500 ease-in-out ${isScrolled && !isHeroHovered ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-3xl md:text-4xl lg:text-5xl mb-4'}`}>
                                <span className="flex flex-col md:flex-row md:items-center md:gap-2 flex-wrap">
                                    <span>REPARACIONES <span className="text-slate-400">RÁPIDAS</span></span>
                                    <span className={`transition-all duration-500 ${isScrolled && !isHeroHovered ? 'text-xl md:text-2xl text-white/90' : 'block'}`}>REPUESTOS PARA TODOS</span>
                                </span>
                            </h1>
                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isScrolled && !isHeroHovered ? 'max-h-0 opacity-0 mb-0' : 'max-h-[300px] opacity-100 mt-4'}`}>
                                <p className="text-gray-400 font-medium mb-8 text-sm md:text-base max-w-lg">Encontrá todo lo que necesitás para reparar tu equipo o traelo a nuestros expertos en servicio técnico móvil e informático.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
                                    >
                                        Ver Productos
                                    </button>
                                    <button className="bg-transparent hover:bg-white/10 text-white font-bold py-3 px-8 rounded-xl border-2 border-slate-600 hover:border-slate-500 transition-all">
                                        Contactar Técnico
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-3 group hover:border-primary/50 transition-colors">
                            <span className="material-icons text-primary text-3xl group-hover:scale-110 transition-transform">engineering</span>
                            <div>
                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Técnicos Especializados</h4>
                                <p className="text-xs text-gray-500 mt-1">Más de 5 años reparando celulares</p>
                            </div>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-3 group hover:border-primary/50 transition-colors">
                            <span className="material-icons text-primary text-3xl group-hover:scale-110 transition-transform">inventory_2</span>
                            <div>
                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Amplio Stock</h4>
                                <p className="text-xs text-gray-500 mt-1">Pantallas, baterías, módulos y más</p>
                            </div>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-3 group hover:border-primary/50 transition-colors">
                            <span className="material-icons text-primary text-3xl group-hover:scale-110 transition-transform">troubleshoot</span>
                            <div>
                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Diagnóstico sin cargo</h4>
                                <p className="text-xs text-gray-500 mt-1">Revisamos tu equipo gratis</p>
                            </div>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-3 group hover:border-primary/50 transition-colors">
                            <span className="material-icons text-primary text-3xl group-hover:scale-110 transition-transform">thumb_up</span>
                            <div>
                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Clientes Satisfechos</h4>
                                <p className="text-xs text-gray-500 mt-1">Servicio rápido y confiable</p>
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
                            {filteredProducts.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                                    <span className="material-icons text-5xl mb-2 opacity-30">search_off</span>
                                    <p>No se encontraron productos para esta búsqueda o categoría.</p>
                                </div>
                            ) : (
                                filteredProducts.map(product => (
                                    <Link
                                        key={product.id}
                                        href={`/product/${product.id}`}
                                        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all group flex flex-col hover:-translate-y-1 duration-300 block relative ${selectedProductIds.includes(product.id) ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 dark:border-gray-700'}`}
                                    >
                                        {isAdminOrEmployee() && (
                                            <div
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleProductSelection(product.id);
                                                }}
                                                className={`absolute top-2 left-2 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedProductIds.includes(product.id) ? 'bg-primary border-primary' : 'bg-white/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 opacity-0 group-hover:opacity-100'}`}
                                            >
                                                {selectedProductIds.includes(product.id) && (
                                                    <span className="material-icons text-white text-[16px]">check</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="relative aspect-square bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center p-4">
                                            {product.image_url ? (
                                                <img src={`http://localhost:3001${product.image_url}`} alt={product.model} className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <span className="material-icons text-gray-300 dark:text-gray-600 text-6xl">image_not_supported</span>
                                            )}
                                            {(() => {
                                                const getStock = (p) => {
                                                    if (!p) return 0;
                                                    if (p.stock_online && typeof p.stock_online.quantity === 'number') return p.stock_online.quantity;
                                                    if (typeof p.stock_online === 'number') return p.stock_online;
                                                    if (typeof p.stockOnline === 'number') return p.stockOnline;
                                                    return 0;
                                                };
                                                const stockO = getStock(product);
                                                const stockP = (product.stock_physical?.quantity || product.stock_physical || 0);
                                                if (stockO === 0 && (typeof stockP === 'number' ? stockP : stockP.quantity) === 0) {
                                                    return <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">Sin Stock</span>;
                                                }
                                                return null;
                                            })()}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleFavorite(product);
                                                }}
                                                className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ${isAdminOrEmployee() ? 'hidden' : ''}`}
                                                title="Añadir a Favoritos"
                                            >
                                                <span className="material-icons text-[18px]">
                                                    {isFavorite(product.id) ? 'favorite' : 'favorite_border'}
                                                </span>
                                            </button>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <p className="text-[10px] sm:text-xs text-gray-500 mb-1 uppercase tracking-wide font-bold line-clamp-1">{Array.isArray(product.category) ? product.category.join(", ") : product.category} • {product.brand}</p>
                                            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2 min-h-[40px] leading-tight text-sm sm:text-base">{product.model}</h3>
                                            {product.compatibility && (
                                                <p className="text-[10px] sm:text-xs text-gray-500 mb-3 line-clamp-1 italic bg-gray-50 dark:bg-gray-700/50 inline-block px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">Para: {product.compatibility}</p>
                                            )}
                                            <div className="mt-auto">
                                                <div className="flex items-end justify-between">
                                                    <span className="text-lg sm:text-xl font-black text-primary">${Number(product.price).toLocaleString('es-AR')}</span>
                                                    {!isAdminOrEmployee() ? (
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
                                                                return q <= 0;
                                                            })()
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                                                : 'bg-gray-100 hover:bg-primary hover:text-white dark:bg-gray-700 dark:hover:bg-primary text-gray-800 dark:text-white'
                                                                }`}
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
                                                    ) : (
                                                        <div className="flex gap-1.5 z-10">
                                                            <button
                                                                title="Editar Producto"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(product); }}
                                                                className="bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm"
                                                            >
                                                                <span className="material-icons text-sm">edit</span>
                                                            </button>
                                                            <button
                                                                title="Gestión de Stock (Online / Físico)"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openStockModal(product); }}
                                                                className="bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm"
                                                            >
                                                                <span className="material-icons text-sm">inventory</span>
                                                            </button>
                                                            <button
                                                                title="Venta Física (Mostrador)"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openSaleModal(product); }}
                                                                className="bg-emerald-100 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm"
                                                            >
                                                                <span className="material-icons text-sm">point_of_sale</span>
                                                            </button>

                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}


                </main>
            </div >

            <div className="fixed bottom-6 right-6 z-50">
                <button className="bg-secondary hover:bg-gray-800 text-white rounded-full p-4 shadow-lg shadow-gray-500/40 flex items-center gap-2 transition-all hover:scale-105 group">
                    <span className="material-icons text-2xl animate-pulse">chat</span>
                    <span className="font-bold pr-2 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Asistente Virtual</span>
                </button>
            </div>

            <Footer />

            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                product={selectedAdminProduct}
                onProductUpdated={() => fetchProducts()}
            />

            <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    fetchProducts(); // Refrescar catálogo al cerrar
                }}
            />

            <BulkProductUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => {
                    setIsBulkModalOpen(false);
                    fetchProducts(); // Refrescar catálogo masivo
                }}
            />

            <StockUpdateModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                product={selectedAdminProduct}
                onSuccess={() => fetchProducts()}
            />

            <PhysicalSaleModal
                isOpen={isSaleModalOpen}
                onClose={() => setIsSaleModalOpen(false)}
                product={selectedAdminProduct}
                onSuccess={() => fetchProducts()}
            />

            <DeleteProductModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                product={selectedAdminProduct}
                onSuccess={() => fetchProducts()}
            />

            {/* Bulk Action Modals */}
            <BulkDeleteModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                selectedIds={selectedProductIds}
                onSuccess={() => {
                    fetchProducts();
                    clearSelection();
                }}
            />

            <BulkPriceEditModal
                isOpen={isBulkPriceModalOpen}
                onClose={() => setIsBulkPriceModalOpen(false)}
                selectedIds={selectedProductIds}
                onSuccess={() => {
                    fetchProducts();
                    clearSelection();
                }}
            />

            {/* Floating Bulk Actions Bar */}
            {selectedProductIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-bottom-10 duration-300">
                    <div className="bg-gray-900 border border-gray-800 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 backdrop-blur-md bg-opacity-95">
                        <div className="flex items-center gap-2 border-r border-gray-700 pr-6">
                            <span className="bg-primary p-1.5 rounded-lg text-xs font-black min-w-[24px] text-center">{selectedProductIds.length}</span>
                            <span className="text-sm font-bold opacity-80">Seleccionados</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsBulkPriceModalOpen(true)}
                                className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-xl transition-all text-sm font-bold"
                            >
                                <span className="material-icons text-blue-400">monetization_on</span>
                                Editar Precio
                            </button>
                            <button
                                onClick={() => setIsBulkDeleteModalOpen(true)}
                                className="flex items-center gap-2 hover:bg-red-500/20 px-4 py-2 rounded-xl transition-all text-sm font-bold text-red-400"
                            >
                                <span className="material-icons">delete</span>
                                Eliminar
                            </button>
                        </div>

                        <div className="border-l border-gray-700 pl-6">
                            <button
                                onClick={clearSelection}
                                className="text-xs font-bold opacity-50 hover:opacity-100 transition-opacity uppercase tracking-wider"
                            >
                                Descartar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
