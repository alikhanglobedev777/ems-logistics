import { createContext, useContext } from 'react';
import type { CurrentUser } from '../api/auth.api';

export type AuthContextValue = {
  user: CurrentUser | null;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) throw new Error('useAuth must be used inside AuthGate');

  return context;
}
