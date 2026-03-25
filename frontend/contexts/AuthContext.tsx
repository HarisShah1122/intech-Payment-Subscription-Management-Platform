'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authApi, handleApiError } from '../lib/api';

// Types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  avatar?: string;
  phone?: string;
  address?: any;
  preferences?: any;
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  clearError: () => void;
}

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && response.data?.user) {
            dispatch({ type: 'SET_USER', payload: response.data.user });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  // Actions
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authApi.login(email, password);
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authApi.register(userData);
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    try {
      // Call logout API (but don't wait for it)
      authApi.logout().catch(console.error);
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Update state
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authApi.updateProfile(userData);
      
      if (response.success && response.data?.user) {
        dispatch({ type: 'SET_USER', payload: response.data.user });
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authApi.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        // Password changed successfully
        return;
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authApi.forgotPassword(email);
      
      if (!response.success) {
        throw new Error(response.message || 'Password reset request failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authApi.resetPassword(token, newPassword);
      
      if (!response.success) {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authApi.verifyEmail(token);
      
      if (!response.success) {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resendVerification = async (email: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authApi.resendVerification(email);
      
      if (!response.success) {
        throw new Error(response.message || 'Verification email resend failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const googleLogin = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authApi.googleLogin();
      
      if (response.success && response.data?.url) {
        // Redirect to Google OAuth
        window.location.href = response.data.url;
      } else {
        throw new Error(response.message || 'Google login failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    googleLogin,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
