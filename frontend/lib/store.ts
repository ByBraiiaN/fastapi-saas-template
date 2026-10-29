"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/api";

type Session = {
  token: string;
  user: AuthUser;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setToken: (token: string | null) => void;
  setSession: (session: Session) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setToken: (token) => set({ token }),
      setSession: ({ token, user }) => set({ token, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "orbit-auth",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      skipHydration: true,
    }
  )
);
