/**
 * Centralised API client.
 * - Token interceptor (from useAuthStore)
 * - In dev: AsyncStorage key DEV_API_BASE_URL overrides base URL (no .env/restart needed)
 * - In-memory TTL cache keyed by url + params
 * - Retry on network errors (max 2), not on 4xx
 *
 * cachedGet(url, ttlMs, axiosConfig)
 *   → returns response.data (the raw JSON body)
 *   → never throws for 304-style cache hits
 *
 * getProducts(params) → { products, page, pages, total }
 *   Centralises the new paginated response shape.
 */
import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/useAuthStore';

const DEFAULT_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'https://backendapis.srivinayakacollections.com';
export const baseURL = DEFAULT_BASE_URL;
export const imageBaseURL = Constants.expoConfig?.extra?.imageBaseUrl || 'https://backendapis.srivinayakacollections.com';

export const DEV_API_STORAGE_KEY = 'DEV_API_BASE_URL';

/** For API requests (axios baseURL). */
export const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${baseURL}${path.startsWith('/') ? '' : '/'}${path}`;
};

/** For image/asset URLs only (kept on production when API is local). */
export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${imageBaseURL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const cache = new Map();

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    try {
      const override = await AsyncStorage.getItem(DEV_API_STORAGE_KEY);
      if (override) {
        config.baseURL = override;
        config.__devBaseUrlOverride = override;
      }
    } catch (_) {}
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isNetworkError = !response && (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network')
    );

    if (
      config &&
      config.__devBaseUrlOverride &&
      !config.__retriedWithoutDevOverride &&
      isNetworkError
    ) {
      config.__retriedWithoutDevOverride = true;
      config.baseURL = DEFAULT_BASE_URL;
      delete config.__devBaseUrlOverride;
      return api(config);
    }

    // Don't retry auth errors or 4xx client errors
    if (!config || config.__retryCount >= 2 || (response?.status >= 400 && response?.status < 500)) {
      return Promise.reject(error);
    }
    config.__retryCount = (config.__retryCount || 0) + 1;
    await new Promise((r) => setTimeout(r, 400 * config.__retryCount));
    return api(config);
  }
);

export const cachedGet = async (url, ttlMs = 20000, config = {}) => {
  const key = `${url}:${JSON.stringify(config.params || {})}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.ts < ttlMs) return hit.data;
  const { data } = await api.get(url, config);
  cache.set(key, { ts: now, data });
  return data;
};

/**
 * Fetches products with real pagination metadata.
 * Returns { products: [], page, pages, total }
 * ttlMs = 0 to bypass cache.
 */
export const getProducts = async (params = {}, ttlMs = 10000) => {
  const result = await cachedGet('/api/products', ttlMs, { params });
  // Defensive: handle bare array (old backend) or new paginated shape
  if (Array.isArray(result)) {
    return { products: result, page: 1, pages: 1, total: result.length };
  }
  return result;
};

export const clearApiCache = () => cache.clear();

/** Dev only: set backend URL override (e.g. http://192.168.1.84:5000). No app restart needed. */
export const setDevApiBaseUrl = async (url) => {
  if (!url || typeof url !== 'string') return;
  const trimmed = url.trim();
  const withScheme = trimmed.match(/^https?:\/\//i) ? trimmed : `http://${trimmed}`;
  await AsyncStorage.setItem(DEV_API_STORAGE_KEY, withScheme);
};
/** Dev only: get current override or null. */
export const getDevApiBaseUrl = () => AsyncStorage.getItem(DEV_API_STORAGE_KEY);

export default api;
