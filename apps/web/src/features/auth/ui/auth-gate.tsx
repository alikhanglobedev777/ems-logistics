import { useQueryClient } from '@tanstack/react-query';
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  getMe,
  hasAuthSession,
  login,
  register,
  saveAuthSession,
  type CurrentUser,
} from '../api/auth.api';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(hasAuthSession);

  useEffect(() => {
    let active = true;

    function handleSessionChanged() {
      if (!hasAuthSession()) {
        queryClient.clear();
        setUser(null);
      }
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);

    if (!hasAuthSession()) {
      return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
    }

    void getMe()
      .then((response) => {
        if (active && response.status === 200) setUser(response.data.data);
      })
      .catch(() => {
        if (active) {
          clearAuthSession();
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
    };
  }, [queryClient]);

  const context = useMemo<AuthContextValue>(
    () => ({
      user,
      signOut: () => {
        clearAuthSession();
        queryClient.clear();
        setUser(null);
      },
    }),
    [queryClient, user],
  );

  if (checkingSession) {
    return <div className="auth-loading">Checking your session…</div>;
  }

  if (!user) {
    return (
      <AuthPage
        onAuthenticated={(authenticatedUser) => {
          queryClient.clear();
          setUser(authenticatedUser);
        }}
      />
    );
  }

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>;
}
function AuthPage({ onAuthenticated }: { onAuthenticated: (user: CurrentUser) => void }) {
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');

    try {
      const response = mode === 'login'
        ? await login({ email, password })
        : await register({
            name: String(form.get('name') ?? ''),
            email,
            password,
            roleName: 'super_admin',
          });

      if (response.status !== 200 && response.status !== 201) throw response;

      const session = response.data.data;

      saveAuthSession(session.accessToken, session.refreshToken);
      onAuthenticated(session.user);
    } catch (failure) {
      setError(apiErrorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: 'login' | 'setup') {
    setMode(nextMode);
    setError('');
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">EMS</div>
        <p className="eyebrow">Operations control center</p>
        <h1>{mode === 'login' ? 'Sign in' : 'Set up your workspace'}</h1>
        <p className="auth-intro">
          {mode === 'login'
            ? 'Sign in to manage logistics records.'
            : 'Create the first administrator account for this installation.'}
        </p>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'setup' ? (
            <label>
              Name
              <input name="name" autoComplete="name" required />
            </label>
          ) : null}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
          </label>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create administrator'}
          </button>
        </form>

        <button
          type="button"
          className="auth-mode-button"
          onClick={() => switchMode(mode === 'login' ? 'setup' : 'login')}
        >
          {mode === 'login' ? 'First-time setup' : 'Back to sign in'}
        </button>
      </section>
    </main>
  );
}

function apiErrorMessage(failure: unknown) {
  if (failure && typeof failure === 'object' && 'data' in failure) {
    const data = (failure as { data?: unknown }).data;

    if (data && typeof data === 'object' && 'error' in data) {
      const error = (data as { error?: unknown }).error;

      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string') return message;
      }
    }
  }

  return 'Unable to connect. Check that the API is running and try again.';
}
