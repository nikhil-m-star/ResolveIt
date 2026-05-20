import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PRODUCTION_API_URL = 'https://resolveit-3xtz.onrender.com/api';

const normalizeApiUrl = (value) => {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const getLocalApiUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.experienceUrl;
  const host = hostUri?.split('://').pop()?.split(':')[0];

  if (host) {
    return `http://${host}:5000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

const getApiBaseUrl = () => {
  const configured = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  if (configured) return configured;
  if (__DEV__) return getLocalApiUrl();
  return PRODUCTION_API_URL;
};

const getApiBaseUrlCandidates = () => {
  const configured = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  if (configured) return [configured];
  if (__DEV__) return [getLocalApiUrl(), PRODUCTION_API_URL];
  return [PRODUCTION_API_URL];
};

const API_BASE_URL_CANDIDATES = [...new Set(getApiBaseUrlCandidates())];
let activeBaseUrl = getApiBaseUrl();

export const api = axios.create({
  baseURL: activeBaseUrl,
  headers: {
    'Content-Type': 'application/json'}});

// Request Interceptor: Attach custom internal ResolveIt JWT Bearer token
api.interceptors.request.use(
  async (config) => {
    // Skip token loading for JWT exchange endpoint itself
    if (config.url === '/auth/session') return config;

    config.baseURL = config.baseURL || activeBaseUrl;
    
    try {
      const internalToken = await SecureStore.getItemAsync('resolveit_token');
      if (internalToken) {
        config.headers.Authorization = `Bearer ${internalToken}`;
      }
    } catch (err) {
      console.error('SecureStore: Failed to retrieve ResolveIt JWT token', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Wipe keys from SecureStore on 401 unauthorized
api.interceptors.response.use(
  (response) => {
    if (response?.config?.baseURL && response.config.baseURL !== activeBaseUrl) {
      activeBaseUrl = response.config.baseURL;
      api.defaults.baseURL = activeBaseUrl;
    }
    return response;
  },
  async (error) => {
    const currentBaseUrl = normalizeApiUrl(error?.config?.baseURL || activeBaseUrl);
    const fallbackBaseUrl = API_BASE_URL_CANDIDATES.find((candidate) => candidate !== currentBaseUrl);

    if (
      error?.config &&
      fallbackBaseUrl &&
      !error.config.__fallbackRetried &&
      !error?.response
    ) {
      error.config.__fallbackRetried = true;
      error.config.baseURL = fallbackBaseUrl;
      activeBaseUrl = fallbackBaseUrl;
      api.defaults.baseURL = fallbackBaseUrl;
      return api.request(error.config);
    }

    if (error?.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync('resolveit_token');
        await SecureStore.deleteItemAsync('resolveit_user_role');
      } catch (err) {
        console.error('SecureStore: Failed to clear session items', err);
      }
    }
    return Promise.reject(error);
  }
);

export const resolveImageUrl = (url) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const base = (activeBaseUrl || api.defaults.baseURL).replace(/\/api$/, '');
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${base}${normalizedPath}`;
};
