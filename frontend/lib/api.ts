import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized - token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post<ApiResponse>('/auth/register', userData);
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post<ApiResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get<ApiResponse>('/auth/me');
    return response.data;
  },

  updateProfile: async (userData: any) => {
    const response = await api.put<ApiResponse>('/auth/profile', userData);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post<ApiResponse>('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post<ApiResponse>('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email: string) => {
    const response = await api.post<ApiResponse>('/auth/resend-verification', { email });
    return response.data;
  },

  googleLogin: async () => {
    const response = await api.get<ApiResponse>('/auth/google');
    return response.data;
  },
};

// Subscription API
export const subscriptionApi = {
  getPlans: async () => {
    const response = await api.get<ApiResponse>('/subscriptions/plans');
    return response.data;
  },

  getUserSubscriptions: async () => {
    const response = await api.get<ApiResponse>('/subscriptions');
    return response.data;
  },

  getActiveSubscription: async () => {
    const response = await api.get<ApiResponse>('/subscriptions/active');
    return response.data;
  },

  createSubscription: async (data: {
    planId: string;
    paymentMethodId?: string;
    provider: 'stripe' | 'paypal';
    trialPeriodDays?: number;
  }) => {
    const response = await api.post<ApiResponse>('/subscriptions', data);
    return response.data;
  },

  updateSubscription: async (subscriptionId: string, planId: string) => {
    const response = await api.put<ApiResponse>(`/subscriptions/${subscriptionId}`, { planId });
    return response.data;
  },

  cancelSubscription: async (subscriptionId: string, immediate: boolean = false) => {
    const response = await api.delete<ApiResponse>(`/subscriptions/${subscriptionId}`, {
      data: { immediate },
    });
    return response.data;
  },

  getSubscriptionTransactions: async (subscriptionId: string) => {
    const response = await api.get<ApiResponse>(`/subscriptions/${subscriptionId}/transactions`);
    return response.data;
  },

  // Admin endpoints
  getAllSubscriptions: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    provider?: string;
    search?: string;
  }) => {
    const response = await api.get<PaginatedResponse<any>>('/admin/subscriptions', { params });
    return response.data;
  },

  getSubscriptionStats: async () => {
    const response = await api.get<ApiResponse>('/admin/subscriptions/stats');
    return response.data;
  },
};

// Payment API
export const paymentApi = {
  createPaymentIntent: async (data: {
    amount: number;
    currency?: string;
    paymentMethodId?: string;
    description?: string;
  }) => {
    const response = await api.post<ApiResponse>('/payments/create-intent', data);
    return response.data;
  },

  confirmPayment: async (data: {
    paymentIntentId: string;
    transactionId: string;
  }) => {
    const response = await api.post<ApiResponse>('/payments/confirm', data);
    return response.data;
  },

  createPayPalOrder: async (data: {
    amount: number;
    currency?: string;
    description?: string;
  }) => {
    const response = await api.post<ApiResponse>('/payments/paypal/create-order', data);
    return response.data;
  },

  capturePayPalOrder: async (data: {
    orderId: string;
    transactionId: string;
  }) => {
    const response = await api.post<ApiResponse>('/payments/paypal/capture-order', data);
    return response.data;
  },

  getPaymentHistory: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) => {
    const response = await api.get<PaginatedResponse<any>>('/payments/history', { params });
    return response.data;
  },

  getPaymentDetails: async (transactionId: string) => {
    const response = await api.get<ApiResponse>(`/payments/${transactionId}`);
    return response.data;
  },

  refundPayment: async (data: {
    transactionId: string;
    reason?: string;
    amount?: number;
  }) => {
    const response = await api.post<ApiResponse>('/payments/refund', data);
    return response.data;
  },

  getUserSpending: async () => {
    const response = await api.get<ApiResponse>('/payments/spending');
    return response.data;
  },

  getPaymentMethods: async () => {
    const response = await api.get<ApiResponse>('/payments/methods');
    return response.data;
  },

  setDefaultPaymentMethod: async (paymentMethodId: string) => {
    const response = await api.put<ApiResponse>('/payments/methods/default', { paymentMethodId });
    return response.data;
  },

  deletePaymentMethod: async (paymentMethodId: string) => {
    const response = await api.delete<ApiResponse>(`/payments/methods/${paymentMethodId}`);
    return response.data;
  },
};

// User API
export const userApi = {
  getProfile: async () => {
    const response = await api.get<ApiResponse>('/users/profile');
    return response.data;
  },

  updateProfile: async (userData: any) => {
    const response = await api.put<ApiResponse>('/users/profile', userData);
    return response.data;
  },

  // Admin endpoints
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    emailVerified?: boolean;
  }) => {
    const response = await api.get<PaginatedResponse<any>>('/admin/users', { params });
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await api.get<ApiResponse>(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId: string, data: {
    isActive?: boolean;
    role?: string;
  }) => {
    const response = await api.put<ApiResponse>(`/admin/users/${userId}/status`, data);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete<ApiResponse>(`/admin/users/${userId}`);
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get<ApiResponse>('/admin/users/stats');
    return response.data;
  },

  exportUserData: async () => {
    const response = await api.get('/admin/users/export', {
      responseType: 'blob',
    });
    return response;
  },
};

// Health API
export const healthApi = {
  checkHealth: async () => {
    const response = await api.get<ApiResponse>('/health');
    return response.data;
  },

  checkDetailedHealth: async () => {
    const response = await api.get<ApiResponse>('/health/detailed');
    return response.data;
  },
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Export default API instance
export default api;
