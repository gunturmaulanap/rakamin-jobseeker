import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "candidate";
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
  success: string;
  isSubmitting: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  setSubmitting: (submitting: boolean) => void;
  resetMessages: () => void;
  // Simplified auth actions
  signInWithPassword: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: "",
  success: "",
  isSubmitting: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  resetMessages: () => set({ error: "", success: "" }),

  // Simplified sign in with password
  signInWithPassword: async (email: string, password: string) => {
    const { setLoading, setError, setSubmitting } = get();

    if (get().isSubmitting || get().isLoading) return false;

    setLoading(true);
    setSubmitting(true);
    setError("");

    try {
      if (!email || !password) {
        setError("Email dan password wajib diisi");
        return false;
      }

      // Authenticate with Supabase
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        let errorMessage = signInError.message || "Login gagal";
        if (signInError.message?.includes("Invalid login credentials")) {
          errorMessage = "Email atau password salah";
        } else if (signInError.message?.includes("rate limit")) {
          errorMessage = "Terlalu banyak percobaan. Silakan tunggu.";
        }

        setError(errorMessage);
        return false;
      }

      // Determine role based on email patterns (simple approach)
      const isAdminEmail =
        signInData.user.email?.includes("admin") ||
        signInData.user.email?.includes("recruitment") ||
        signInData.user.email?.endsWith("@rakamin.com");

      const userRole = isAdminEmail ? "admin" : "candidate";

      const userData = {
        id: signInData.user.id,
        email: signInData.user.email || "",
        full_name:
          signInData.user.user_metadata?.full_name ||
          signInData.user.email?.split("@")[0] ||
          "",
        role: userRole as "admin" | "candidate",
      };

      // Update Zustand store
      set({
        user: userData,
        isAuthenticated: true,
        success:
          userRole === "admin"
            ? "Login berhasil! Mengarahkan ke dashboard admin..."
            : "Login berhasil! Mengarahkan ke dashboard kandidat...",
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat login");
      return false;
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  },

  // Simplified sign out
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false });
    } catch (err: any) {
      console.error("Sign out error:", err);
    }
  },

  // Simplified logout function
  logout: async () => {
    try {
      // Clear state immediately
      set({ user: null, isAuthenticated: false, error: "", success: "" });

      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();

      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (err: any) {
      // Force clear everything on error
      set({ user: null, isAuthenticated: false, error: "", success: "" });
      localStorage.clear();
      sessionStorage.clear();
    }
  },

  // Simplified initialize auth
  initializeAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Simple user data creation from session
        const isAdminEmail =
          session.user.email?.includes("admin") ||
          session.user.email?.includes("recruitment") ||
          session.user.email?.endsWith("@rakamin.com");

        const userData = {
          id: session.user.id,
          email: session.user.email || "",
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "",
          role: isAdminEmail ? ("admin" as const) : ("candidate" as const),
        };

        set({
          user: userData,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      // Clear any invalid session
      await supabase.auth.signOut();
    }
  },
}));
