import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create()(
    persist(
        (set, get) => ({
            token: null,
            user: null,

            setAuth: (token, user) => set({ token, user }),

            logout: () => set({ token: null, user: null }),

            isAuthenticated: () => !!get().token,

            isAdminOrEmployee: () => {
                const user = get().user;
                if (!user || !user.role) return false;
                const role = user.role.name;
                return role === 'Developer' || role === 'Admin' || role === 'Employee';
            },

            isDeveloper: () => {
                const user = get().user;
                if (!user || !user.role) return false;
                return user.role.name === 'Developer';
            },

            canBulkUpload: () => {
                return get().isDeveloper();
            },

            isAdmin: () => {
                const user = get().user;
                if (!user || !user.role) return false;
                return user.role.name === 'Admin';
            }
        }),
        {
            name: 'auth-storage', // name of item in the storage (must be unique)
        }
    )
);
