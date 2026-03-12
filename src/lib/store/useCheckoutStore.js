import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCheckoutStore = create(
    persist(
        (set) => ({
            currentOrderId: null,
            expiresAt: null, // ISO String

            setCheckoutSession: (orderId, expiresAt) => {
                set({ currentOrderId: orderId, expiresAt });
            },

            clearCheckoutSession: () => {
                set({ currentOrderId: null, expiresAt: null });
            },

            isExpired: () => {
                const expiresAt = useCheckoutStore.getState().expiresAt;
                if (!expiresAt) return false;
                return new Date() > new Date(expiresAt);
            }
        }),
        {
            name: 'mi-tienda-checkout',
        }
    )
);
