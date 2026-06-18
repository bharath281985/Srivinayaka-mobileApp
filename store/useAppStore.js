/**
 * useAppStore — persisted with AsyncStorage
 * Keys persisted: cart, wishlist, addresses, recentlyViewed
 * Notifications are NOT persisted (ephemeral session only)
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'saree_app_state';

// ─── Persist helpers ──────────────────────────────────────────────
const save = async (slice) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...slice }));
  } catch { /* silently fail — store remains usable */ }
};

const load = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAppStore = create((set, get) => ({
  // ── Hydration ─────────────────────────────────────────────────────
  appHydrated: false,
  introSeen: false,
  hydrateApp: async () => {
    const saved = await load();
    if (saved) {
      set({
        cart: saved.cart || [],
        wishlist: saved.wishlist || [],
        addresses: saved.addresses || [],
        recentlyViewed: saved.recentlyViewed || [],
        appHydrated: true,
        introSeen: false,
      });
    } else {
      set({ appHydrated: true, introSeen: false });
    }
  },

  // ── Cart ──────────────────────────────────────────────────────────
  markIntroSeen: () => set({ introSeen: true }),
  cart: [],
  addToCart: (product, qty = 1, selectedVariant = null) =>
    set((state) => {
      // Identity is productId + variantId (if any)
      const cartItemId = selectedVariant
        ? `${product._id}-${selectedVariant._id || selectedVariant.sku}`
        : product._id;

      const existing = state.cart.find((i) => {
        const iId = i.selectedVariant
          ? `${i.product._id}-${i.selectedVariant._id || i.selectedVariant.sku}`
          : i.product._id;
        return iId === cartItemId;
      });

      let newCart;
      if (existing) {
        newCart = state.cart.map((i) => {
          const iId = i.selectedVariant
            ? `${i.product._id}-${i.selectedVariant._id || i.selectedVariant.sku}`
            : i.product._id;
          return iId === cartItemId
            ? { ...i, qty: Math.max(1, i.qty + qty) }
            : i;
        });
      } else {
        newCart = [...state.cart, { product, qty: Math.max(1, qty), selectedVariant }];
      }
      save({ cart: newCart });
      return { cart: newCart };
    }),
  removeFromCart: (productId, variantId = null) =>
    set((state) => {
      const matchId = variantId ? `${productId}-${variantId}` : productId;
      const newCart = state.cart.filter((i) => {
        const iId = i.selectedVariant
          ? `${i.product._id}-${i.selectedVariant._id || i.selectedVariant.sku}`
          : i.product._id;
        return iId !== matchId;
      });
      save({ cart: newCart });
      return { cart: newCart };
    }),
  clearCart: () => {
    save({ cart: [] });
    set({ cart: [] });
  },
  cartTotals: () => {
    const { cart } = get();
    const itemsPrice = cart.reduce((s, i) => {
      const variantPrice = Number(i.selectedVariant?.basePrice || 0);
      const basePrice = Number(i.product.basePrice || 0);
      const additionalPrice = Number(i.selectedVariant?.additionalPrice || 0);
      return s + i.qty * (variantPrice || (basePrice + additionalPrice));
    }, 0);
    const count = cart.reduce((s, i) => s + i.qty, 0);
    return { itemsPrice, count };
  },

  // ── Wishlist ──────────────────────────────────────────────────────
  wishlist: [],
  toggleWishlist: (product) =>
    set((state) => {
      const exists = state.wishlist.some((p) => p._id === product._id);
      const newWishlist = exists
        ? state.wishlist.filter((p) => p._id !== product._id)
        : [...state.wishlist, product];
      save({ wishlist: newWishlist });
      return { wishlist: newWishlist };
    }),

  // ── Recently Viewed ───────────────────────────────────────────────
  recentlyViewed: [],
  addRecent: (product) =>
    set((state) => {
      const newList = [
        product,
        ...state.recentlyViewed.filter((p) => p._id !== product._id),
      ].slice(0, 20);
      save({ recentlyViewed: newList });
      return { recentlyViewed: newList };
    }),

  // ── Addresses ────────────────────────────────────────────────────
  addresses: [],
  setAddresses: (addresses) => {
    save({ addresses });
    set({ addresses });
  },
  addAddress: (address) =>
    set((state) => {
      const newAddresses = [...state.addresses, { ...address, id: Date.now().toString() }];
      save({ addresses: newAddresses });
      return { addresses: newAddresses };
    }),
  updateAddress: (id, updates) =>
    set((state) => {
      const newAddresses = state.addresses.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      save({ addresses: newAddresses });
      return { addresses: newAddresses };
    }),
  removeAddress: (id) =>
    set((state) => {
      const newAddresses = state.addresses.filter((a) => a.id !== id);
      save({ addresses: newAddresses });
      return { addresses: newAddresses };
    }),
  setDefaultAddress: (id) =>
    set((state) => {
      const newAddresses = state.addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }));
      save({ addresses: newAddresses });
      return { addresses: newAddresses };
    }),

  // ── Notifications (session-only — not persisted) ──────────────────
  notifications: [],
  setNotifications: (items) => set({ notifications: items }),
  addNotification: (item) =>
    set((state) => ({
      notifications: [
        { ...item, id: Date.now().toString(), createdAt: new Date().toISOString() },
        ...state.notifications,
      ],
    })),
  clearNotifications: () => set({ notifications: [] }),

  // ── Toast (ephemeral) ──────────────────────────────────────────
  toast: null, // { message, type, id }
  showToast: (message, type = 'success') => {
    const id = Date.now();
    set({ toast: { message, type, id } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 3200);
  },
  hideToast: () => set({ toast: null }),
}));
