import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createElement } from "react";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../lib/supabase";
import {
  login as loginService,
  logout as logoutService,
  fetchUserProfile,
  type LoginParams,
} from "../services/auth";
import type { UserProfile } from "../types/database";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: UserProfile | null;
}

interface AuthContextValue extends AuthState {
  login: (params: LoginParams) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_CACHE_KEY = "mieru_profile_cache";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    profile: null,
  });

  // 起動時にセッション復元
  useEffect(() => {
    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setState({ isLoading: false, isAuthenticated: false, profile: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const restoreSession = async () => {
    try {
      // まずローカルキャッシュからプロフィール復元（オフライン起動対応）
      const cached = await SecureStore.getItemAsync(PROFILE_CACHE_KEY);
      if (cached) {
        const profile: UserProfile = JSON.parse(cached);
        setState({ isLoading: false, isAuthenticated: true, profile });
      }

      // セッションがあるか確認
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const profile = await fetchUserProfile();
        if (profile) {
          await SecureStore.setItemAsync(
            PROFILE_CACHE_KEY,
            JSON.stringify(profile)
          );
          setState({ isLoading: false, isAuthenticated: true, profile });
          return;
        }
      }

      // セッションがなく、キャッシュもなければ未認証
      if (!cached) {
        setState({ isLoading: false, isAuthenticated: false, profile: null });
      }
    } catch {
      setState({ isLoading: false, isAuthenticated: false, profile: null });
    }
  };

  const login = useCallback(async (params: LoginParams) => {
    const result = await loginService(params);
    if (result.success && result.profile) {
      await SecureStore.setItemAsync(
        PROFILE_CACHE_KEY,
        JSON.stringify(result.profile)
      );
      setState({
        isLoading: false,
        isAuthenticated: true,
        profile: result.profile,
      });
    }
    return { success: result.success, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    await SecureStore.deleteItemAsync(PROFILE_CACHE_KEY);
    setState({ isLoading: false, isAuthenticated: false, profile: null });
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { ...state, login, logout } },
    children
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
