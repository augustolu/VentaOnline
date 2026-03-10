import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFavoritesStore = create(
    persist(
        (set, get) => ({
            items: [], // Array of products

            toggleFavorite: (product) => {
                set((state) => {
                    const isFavorite = state.items.some((item) => item.id === product.id);
                    if (isFavorite) {
                        return {
                            items: state.items.filter((item) => item.id !== product.id),
                        };
                    } else {
                        return {
                            items: [product, ...state.items],
                        };
                    }
                });
            },

            isFavorite: (productId) => {
                return get().items.some((item) => item.id === productId);
            },

            clearFavorites: () => set({ items: [] }),

            getTotalFavorites: () => {
                return get().items.length;
            },
        }),
        {
            name: 'mi-tienda-favorites', // key in local storage
        }
    )
);
