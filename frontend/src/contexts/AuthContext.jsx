import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  token: "gm_access_token",
  user: "gm_user",
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

const fetchJson = async (input, init) => {
  const response = await fetch(input, init);
  const text = await response.text();
  let parsed;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  if (!response.ok) {
    const error = new Error(parsed?.message || response.statusText);
    error.status = response.status;
    error.payload = parsed;
    throw error;
  }
  return parsed;
};

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.token),
  );
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.user);
    return stored ? JSON.parse(stored) : null;
  });
  const [initializing, setInitializing] = useState(true);
  const refreshInFlight = useRef(null);

  const persistSession = useCallback((nextUser, token) => {
    if (nextUser) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
      setUser(nextUser);
    }
    if (token) {
      localStorage.setItem(STORAGE_KEYS.token, token);
      setAccessToken(token);
    }
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.token);
    setUser(null);
    setAccessToken(null);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (refreshInFlight.current) {
      return refreshInFlight.current;
    }
    refreshInFlight.current = fetchJson(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((data) => {
        if (data?.accessToken) {
          persistSession(user ?? null, data.accessToken);
        }
        return data?.accessToken ?? null;
      })
      .catch((error) => {
        console.error("Failed to refresh token", error);
        clearSession();
        return null;
      })
      .finally(() => {
        refreshInFlight.current = null;
      });
    return refreshInFlight.current;
  }, [clearSession, persistSession, user]);

  const apiFetch = useCallback(
    async (path, { auth = true, headers = {}, ...options } = {}, retry = true) => {
      const requestInit = {
        credentials: "include",
        ...options,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...headers,
        },
      };

      if (options?.body instanceof FormData) {
        delete requestInit.headers["Content-Type"];
      }

      let token = accessToken;
      if (auth) {
        if (!token) {
          token = await refreshAccessToken();
        }
        if (token) {
          requestInit.headers.Authorization = `Bearer ${token}`;
        }
      }

      try {
        return await fetchJson(`${API_BASE_URL}${path}`, requestInit);
      } catch (error) {
        if (error.status === 401 && retry) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            return apiFetch(path, { auth, headers, ...options }, false);
          }
        }
        throw error;
      }
    },
    [accessToken, refreshAccessToken],
  );

  const login = useCallback(
    async ({ email, password }) => {
      const payload = await fetchJson(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (payload?.accessToken) {
        persistSession(payload.user, payload.accessToken);
      }
      return payload;
    },
    [persistSession],
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const payload = await fetchJson(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (payload?.accessToken) {
        persistSession(payload.user, payload.accessToken);
      }
      return payload;
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    try {
      await fetchJson(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.warn("Logout request failed", error);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      if (accessToken && user) {
        setInitializing(false);
        return;
      }
      try {
        const refreshed = await refreshAccessToken();
        if (refreshed && !cancelled) {
          const profile = await apiFetch("/auth/me");
          persistSession(profile?.user ?? null, refreshed);
        }
      } catch (error) {
        console.warn("Bootstrap auth failed", error);
        clearSession();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [accessToken, apiFetch, clearSession, persistSession, refreshAccessToken, user]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      initializing,
      login,
      register,
      logout,
      apiFetch,
      refreshAccessToken,
      setUser: (nextUser) => {
        persistSession(nextUser, accessToken);
      },
      showError: (message, description) =>
        toast.error(message, { description }),
      showSuccess: (message, description) =>
        toast.success(message, { description }),
    }),
    [
      accessToken,
      apiFetch,
      initializing,
      login,
      logout,
      register,
      refreshAccessToken,
      persistSession,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
