import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'saree_auth';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  onboardingDone: false,
  hydrated: false,
  postLoginRedirect: null,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          token: parsed.token || null,
          user: parsed.user || null,
          onboardingDone: !!parsed.onboardingDone,
          hydrated: true,
        });
        return;
      }
    } catch {
      // Corrupt storage — reset
    }
    set({ hydrated: true });
  },

  finishOnboarding: async () => {
    const state = get();
    const next = { token: state.token, user: state.user, onboardingDone: true };
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    set({ onboardingDone: true });
  },

  login: async ({ token, user }) => {
    const state = get();
    await AsyncStorage.setItem(KEY, JSON.stringify({ token, user, onboardingDone: state.onboardingDone }));
    set({ token, user });
  },

  logout: async () => {
    const state = get();
    await AsyncStorage.setItem(KEY, JSON.stringify({ token: null, user: null, onboardingDone: state.onboardingDone }));
    set({ token: null, user: null });
  },

  setPostLoginRedirect: (routeName, params = {}) => {
    set({ postLoginRedirect: routeName ? { routeName, params } : null });
  },

  clearPostLoginRedirect: () => {
    set({ postLoginRedirect: null });
  },
}));
