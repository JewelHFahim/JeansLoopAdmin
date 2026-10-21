import axios from 'axios';
import type {
  Product,
  Category,
  Order,
  Coupon,
  Slider,
  SiteSettings,
  UserItem,
  DashboardStats,
  ApiResponse,
  PaginatedResponse,
} from './api-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Automatic token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window === 'undefined') {
        return Promise.reject(error);
      }

      // If the 401 came from login or refresh itself, clear credentials and redirect to login
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<ApiResponse<{ token: string; user?: any }>>(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.data.token;
        localStorage.setItem('token', newToken);
        if (data.data.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }
        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<{ user: any; token: string }>>('/auth/login', data),
  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),
};

export const productsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Product>>('/products', { params }),
  getById: (id: string) => apiClient.get<ApiResponse<Product>>(`/products/details/${id}`),
  create: (data: Partial<Product>) => apiClient.post<ApiResponse<Product>>('/products', data),
  update: (id: string, data: Partial<Product>) =>
    apiClient.put<ApiResponse<Product>>(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/products/${id}`),
};

export const ordersApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Order>>('/orders', { params }),
  getById: (id: string) => apiClient.get<ApiResponse<Order>>(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.put<ApiResponse<Order>>(`/orders/${id}/status`, { status }),
  updateDetails: (id: string, data: Record<string, unknown>) =>
    apiClient.put<ApiResponse<Order>>(`/orders/${id}/details`, data),
  markAsPaid: (id: string) => apiClient.put<ApiResponse<Order>>(`/orders/${id}/pay`),
  markAsDelivered: (id: string) => apiClient.put<ApiResponse<Order>>(`/orders/${id}/deliver`),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/orders/${id}`),
};

export const categoriesApi = {
  getAll: () => apiClient.get<ApiResponse<Category[]>>('/categories'),
  getById: (id: string) => apiClient.get<ApiResponse<Category>>(`/categories/${id}`),
  create: (data: Partial<Category>) => apiClient.post<ApiResponse<Category>>('/categories', data),
  update: (id: string, data: Partial<Category>) =>
    apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/categories/${id}`),
};

export const couponsApi = {
  getAll: () => apiClient.get<ApiResponse<Coupon[]>>('/coupons'),
  getById: (id: string) => apiClient.get<ApiResponse<Coupon>>(`/coupons/${id}`),
  create: (data: Partial<Coupon>) => apiClient.post<ApiResponse<Coupon>>('/coupons', data),
  update: (id: string, data: Partial<Coupon>) =>
    apiClient.put<ApiResponse<Coupon>>(`/coupons/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/coupons/${id}`),
};

export const slidersApi = {
  getAll: () => apiClient.get<ApiResponse<Slider[]>>('/sliders'),
  getById: (id: string) => apiClient.get<ApiResponse<Slider>>(`/sliders/${id}`),
  create: (data: Partial<Slider>) => apiClient.post<ApiResponse<Slider>>('/sliders', data),
  update: (id: string, data: Partial<Slider>) =>
    apiClient.put<ApiResponse<Slider>>(`/sliders/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/sliders/${id}`),
};

export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; keyword?: string }) =>
    apiClient.get<PaginatedResponse<UserItem>>('/users', { params }),
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/users/${id}`),
};

export const settingsApi = {
  get: () => apiClient.get<ApiResponse<SiteSettings>>('/settings'),
  update: (data: Partial<SiteSettings>) => apiClient.put<ApiResponse<SiteSettings>>('/settings', data),
};

export const statsApi = {
  getDashboard: () => apiClient.get<ApiResponse<DashboardStats>>('/stats'),
};

export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<ApiResponse<{ image: string }>>('/upload', formData);
  },
};
