import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [], // Array of { product, quantity }

            addToCart: (product) => {
                set((state) => {
                    const existingItem = state.items.find((item) => item.product.id === product.id);
                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.product.id === product.id
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            ),
                        };
                    }
                    return { items: [...state.items, { product, quantity: 1 }] };
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
