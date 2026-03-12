import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [], // Array of { product, quantity }

            addToCart: (product) => {
                set((state) => {
                    const getStock = (p) => {
                        if (!p) return 0;
                        // Caso 1: Estructura Prisma { quantity: 10 }
                        if (p.stock_online && typeof p.stock_online.quantity === 'number') {
                            return p.stock_online.quantity;
                        }
                        // Caso 2: Estructura simplificada (número directo)
                        if (typeof p.stock_online === 'number') {
                            return p.stock_online;
                        }
                        // Caso 3: Propiedad camelCase (por si acaso)
                        if (typeof p.stockOnline === 'number') {
                            return p.stockOnline;
                        }
                        return 0;
                    };

                    const stockAvailable = getStock(product);
                    const existingItem = state.items.find((item) => item.product.id === product.id);

                    if (existingItem) {
                        if (existingItem.quantity >= stockAvailable) {
                            return state;
                        }
                        return {
                            items: state.items.map((item) =>
                                item.product.id === product.id
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            ),
                        };
                    }

                    if (stockAvailable <= 0) return state;

                    return { items: [...state.items, { product, quantity: 1 }] };
                });
            },

            increaseQuantity: (productId) => {
                set((state) => {
                    const existingItem = state.items.find((item) => item.product.id === productId);
                    if (!existingItem) return state;

                    const getStock = (p) => {
                        if (!p) return 0;
                        if (p.stock_online && typeof p.stock_online.quantity === 'number') return p.stock_online.quantity;
                        if (typeof p.stock_online === 'number') return p.stock_online;
                        if (typeof p.stockOnline === 'number') return p.stockOnline;
                        return 0;
                    };

                    const stockAvailable = getStock(existingItem.product);

                    if (existingItem.quantity >= stockAvailable) {
                        return state;
                    }

                    return {
                        items: state.items.map((item) =>
                            item.product.id === productId
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    };
                });
            },

            removeFromCart: (productId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.product.id !== productId),
                }));
            },

            decreaseQuantity: (productId) => {
                set((state) => {
                    const existingItem = state.items.find((item) => item.product.id === productId);
                    if (existingItem?.quantity === 1) {
                        return { items: state.items.filter((item) => item.product.id !== productId) };
                    }
                    return {
                        items: state.items.map((item) =>
                            item.product.id === productId
                                ? { ...item, quantity: item.quantity - 1 }
                                : item
                        ),
                    };
                });
            },

            clearCart: () => set({ items: [] }),

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalPrice: () => {
                return get().items.reduce((total, item) => {
                    const price = Number(item.product.price) || 0;
                    return total + price * item.quantity;
                }, 0);
            },
        }),
        {
            name: 'mi-tienda-cart', // key in local storage
        }
    )
);
