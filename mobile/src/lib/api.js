import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const api = axios.create({
  baseURL: 'https://resolveit-3xtz.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach custom internal ResolveIt JWT Bearer token
api.interceptors.request.use(
  async (config) => {
    // Skip token loading for JWT exchange endpoint itself
    if (config.url === '/auth/session') return config;
    
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
  (response) => response,
  async (error) => {
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
