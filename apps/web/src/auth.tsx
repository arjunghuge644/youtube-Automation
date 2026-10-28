import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicAuth, User } from '@creatorflow/shared';
import { api, ApiError, setCsrfToken } from './api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: unknown;
  authenticate: (auth: PublicAuth) => void;
  logout: () => Promise<void>;
  retry: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const session = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const result = await api.me();
        setCsrfToken(result.data.csrfToken);
        return result.data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setCsrfToken(undefined);
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  });

  function authenticate(auth: PublicAuth) {
    client.clear();
    setCsrfToken(auth.csrfToken);
    client.setQueryData(['session'], auth);
  }

  async function logout() {
    await api.logout();
    setCsrfToken(undefined);
    client.clear();
    client.setQueryData(['session'], null);
  }

  return <AuthContext.Provider value={{ user: session.data?.user ?? null, loading: session.isPending, error: session.error, authenticate, logout, retry: () => void session.refetch() }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requires AuthProvider');
  return context;
}
