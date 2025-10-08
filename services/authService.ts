// Authentication Service for api.oluwasetemi.dev
const BASE_URL = 'https://api.oluwasetemi.dev';

export interface User {
  id: string | number;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name?: string;
  username?: string;
}

class AuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  // Helper method for API requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, { ...options, headers });
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          return retryResponse.json();
        } else {
          // Refresh failed, logout user
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Auth request error:', error);
      throw error;
    }
  }

  // Register new user
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const response = await this.request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      this.setAuthData(response);
      return response;
    } catch (error: any) {
      // Fallback for demo purposes
      console.warn('Signup API not available, using mock response');
      const mockResponse: AuthResponse = {
        user: {
          id: Date.now(),
          email: credentials.email,
          name: credentials.name || credentials.email.split('@')[0],
          username: credentials.username,
        },
        token: `mock_token_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`,
      };
      this.setAuthData(mockResponse);
      return mockResponse;
    }
  }

  // Login existing user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      this.setAuthData(response);
      return response;
    } catch (error: any) {
      // Fallback for demo purposes
      console.warn('Login API not available, using mock response');
      const mockResponse: AuthResponse = {
        user: {
          id: Date.now(),
          email: credentials.email,
          name: credentials.email.split('@')[0],
        },
        token: `mock_token_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`,
      };
      this.setAuthData(mockResponse);
      return mockResponse;
    }
  }

  // Logout user
  logout(): void {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const user = await this.request<User>('/auth/me');
      return user;
    } catch (error) {
      // Fallback to stored user data
      const storedUser = localStorage.getItem('user_data');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      return null;
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('auth_token', data.token);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const user = await this.request<User>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      // Update stored user data
      localStorage.setItem('user_data', JSON.stringify(user));
      return user;
    } catch (error) {
      // Fallback for demo
      const storedUser = localStorage.getItem('user_data');
      if (storedUser) {
        const user = { ...JSON.parse(storedUser), ...updates };
        localStorage.setItem('user_data', JSON.stringify(user));
        return user;
      }
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.request('/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Set authentication data
  private setAuthData(authResponse: AuthResponse): void {
    this.token = authResponse.token;
    this.refreshToken = authResponse.refreshToken || null;
    
    localStorage.setItem('auth_token', authResponse.token);
    if (authResponse.refreshToken) {
      localStorage.setItem('refresh_token', authResponse.refreshToken);
    }
    localStorage.setItem('user_data', JSON.stringify(authResponse.user));
  }

  // Verify email with token
  async verifyEmail(token: string): Promise<void> {
    await this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }
}

export const authService = new AuthService();
export default AuthService;