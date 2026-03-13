import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

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
            },

            releaseStock: async () => {
                const { currentOrderId } = useCheckoutStore.getState();
                if (!currentOrderId) return;

                try {
                    await axios.post('http://localhost:3001/api/checkout/cleanup', {
                        order_id: currentOrderId
                    });
                } catch (err) {
                    console.error('Error releasing stock in store:', err);
                } finally {
                    set({ currentOrderId: null, expiresAt: null });
                }
            }
        }),
        {
            name: 'mi-tienda-checkout',
        }
    )
);
