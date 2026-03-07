import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, LoginCredentials, RegisterData, User, AuthResponse } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  fetchUsername: () => Promise<{ username: string, email: string }>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.login(credentials);

          if (response.error) {
            set({ error: response.error, isLoading: false });
            return;
          }

          if (response.data) {
            const { access_token, token_type, expires_in } = response.data;

            // Set token in API client
            apiClient.setToken(access_token);

            // Get user information
            const userResponse = await apiClient.getCurrentUser();

            if (userResponse.error) {
              set({ error: userResponse.error, isLoading: false });
              return;
            }

            if (userResponse.data) {
              set({
                user: userResponse.data,
                token: access_token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.register(userData);

          if (response.error) {
            set({ error: response.error, isLoading: false });
            return;
          }

          if (response.data) {
            // Auto-login after successful registration
            await get().login({
              username: userData.email,
              password: userData.password,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
        }
      },

      logout: () => {
        apiClient.clearToken();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          apiClient.setToken(token);
          const response = await apiClient.getCurrentUser();

          if (response.error) {
            get().logout();
            return;
          }

          if (response.data) {
            set({ user: response.data });
          }
        } catch (error) {
          get().logout();
        }
      },

      updateUser: async (userData: Partial<User>) => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.updateCurrentUser(userData);

          if (response.error) {
            set({ error: response.error, isLoading: false });
            return;
          }

          if (response.data) {
            set({ user: response.data, isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Update failed',
            isLoading: false,
          });
        }
      },

      fetchUsername: async () => {
        const state = get();
        if (!state.token) return { username: 'Guest', email: '' };

        try {
          const response = await apiClient.getUsername();

          if (response.error) {
            return { username: 'Guest', email: '' };
          }

          if (response.data) {
            return response.data;
          }
        } catch (error) {
          return { username: 'Guest', email: '' };
        }

        return { username: 'Guest', email: '' };
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          apiClient.setToken(state.token);
        }
      },
    }
  )
);
