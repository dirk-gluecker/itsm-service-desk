import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

/**
 * Auth token management utilities
 */
const TokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  },
  
  set(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('auth_token', token)
  },
  
  remove(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
  }
}

/**
 * Create configured API client with JWT auth handling
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

/**
 * Request interceptor - attaches JWT token to authenticated requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Don't attach token to auth endpoints (login/register)
    const skipAuth = config.url?.includes('/auth/login') || 
                     config.url?.includes('/auth/register')
    
    if (!skipAuth) {
      const token = TokenStorage.get()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

/**
 * Response interceptor - handles auth errors and token refresh
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Clear invalid token
      TokenStorage.remove()
      
      // Check if we have a refresh token
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
      
      if (refreshToken) {
        // Attempt token refresh
        originalRequest._retry = true
        
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })
          
          // Store new token
          TokenStorage.set(data.accessToken)
          if (data.refreshToken) {
            localStorage.setItem('refresh_token', data.refreshToken)
          }
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return apiClient(originalRequest)
        } catch (refreshError) {
          // Refresh failed - redirect to login
          TokenStorage.remove()
          localStorage.removeItem('refresh_token')
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      } else {
        // No refresh token - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Forbidden: Insufficient permissions')
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error: Unable to reach server')
    }
    
    return Promise.reject(error)
  }
)

/**
 * Auth API methods
 */
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export const authAPI = {
  /**
   * Login user and receive JWT tokens
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    // Store tokens on successful login
    if (response.data.accessToken) {
      TokenStorage.set(response.data.accessToken)
    }
    if (response.data.refreshToken) {
      localStorage.setItem('refresh_token', response.data.refreshToken)
    }
    return response.data
  },
  
  /**
   * Register new user
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData)
    return response.data
  },
  
  /**
   * Logout and clear tokens
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      // Always clear local storage on logout
      TokenStorage.remove()
      localStorage.removeItem('refresh_token')
    }
  },
  
  /**
   * Get current user profile
   */
  getMe: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
  
  /**
   * Manually set token (useful for testing or OAuth flows)
   */
  setToken: (token: string): void => {
    TokenStorage.set(token)
  },
  
  /**
   * Clear token manually
   */
  clearToken: (): void => {
    TokenStorage.remove()
    localStorage.removeItem('refresh_token')
  }
}

/**
 * Generic helper for making authenticated requests
 */
export const authFetch = async <T>(
  url: string,
  options: RequestInit & { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' } = {}
): Promise<T> => {
  const token = TokenStorage.get()
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      TokenStorage.remove()
      window.location.href = '/login'
    }
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

export default apiClient
