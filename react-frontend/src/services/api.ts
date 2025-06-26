import axios, { type AxiosInstance, type AxiosResponse, AxiosError } from 'axios';
import {
  type LoginRequest,
  type RegisterRequest,
  type AuthResponse,
  type User,
  type HallOfFameEntry,
  type HallOfFameResponse,
  type Catalog,
  type LobbyState,
  type CreateLobbyRequest,
  type JoinLobbyRequest,
  type HealthCheckResponse,
  type ApiError
} from '../types/api';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (window.location.protocol === 'https:' ? 
    `https://${window.location.host}/api` : 
    `http://${window.location.host}/api`);
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const RETRY_STATUS_CODES = [502, 503, 504];
const RATE_LIMIT_RETRY_CODES = [429];

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    this.token = localStorage.getItem('jwtToken');
    if (this.token) {
      this.setAuthHeader(this.token);
    }

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 authentication errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          this.clearToken();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Handle retryable errors
        if (
          originalRequest &&
          !originalRequest._retry &&
          error.response &&
          (RETRY_STATUS_CODES.includes(error.response.status) ||
           RATE_LIMIT_RETRY_CODES.includes(error.response.status))
        ) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          if (originalRequest._retryCount <= MAX_RETRIES) {
            const delay = error.response.status === 429 
              ? Math.min(15000, 5000 * originalRequest._retryCount)
              : RETRY_DELAY * originalRequest._retryCount;
            
            console.warn(`Request failed with ${error.response.status}, retrying in ${delay}ms`);
            await this.sleep(delay);
            return this.client(originalRequest);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private setAuthHeader(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private removeAuthHeader(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  private handleError(error: AxiosError): ApiError {
    const response = error.response;
    let message = 'An unexpected error occurred';
    let code = 'UNKNOWN_ERROR';
    let recovery = 'Please try again';

    if (response?.data) {
      const data = response.data as any;
      if (data.error) {
        message = data.error.message || message;
        code = data.error.code || code;
        recovery = data.error.recovery || recovery;
      } else if (data.message) {
        message = data.message;
        code = data.code || code;
      }
    } else if (error.message) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        message = 'Request timed out';
        recovery = 'Please check your connection and try again';
      } else if (error.message.includes('Network Error')) {
        message = 'Cannot connect to the server';
        recovery = 'Please check your network connection';
      } else {
        message = error.message;
      }
    }

    return {
      message,
      status: response?.status,
      code,
      recovery,
      data: response?.data,
      requestId: response?.headers?.['x-request-id'],
    };
  }

  // Token management
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('jwtToken', token);
    this.setAuthHeader(token);
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('jwtToken');
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('jwtToken');
    this.removeAuthHeader();
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (!credentials.username || !credentials.password) {
      throw new Error('Username and password are required');
    }

    try {
      const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/login', credentials);
      
      if (response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      this.clearToken();
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    if (!userData.username || !userData.password || !userData.character) {
      throw new Error('Username, password, and character are required');
    }

    try {
      const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/register', userData);
      
      if (response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      console.warn('Logout endpoint failed:', error);
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response: AxiosResponse<User> = await this.client.get('/auth/me');
      return response.data;
    } catch (error) {
      if ((error as ApiError).status === 401) {
        this.clearToken();
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response: AxiosResponse<HealthCheckResponse> = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Hall of Fame endpoints
  async getHallOfFame(catalogName?: string, limit: number = 10): Promise<HallOfFameResponse> {
    const params = new URLSearchParams();
    if (catalogName) params.append('catalog', catalogName);
    if (limit) params.append('limit', limit.toString());
    
    const endpoint = `/hall-of-fame${params.toString() ? '?' + params.toString() : ''}`;
    const response: AxiosResponse<HallOfFameResponse> = await this.client.get(endpoint);
    return response.data;
  }

  async getLeaderboard(catalog: string, limit: number = 10): Promise<{ catalog: string; leaderboard: any[]; total: number; }> {
    const response: AxiosResponse<{ catalog: string; leaderboard: any[]; total: number; }> = 
      await this.client.get(`/hall-of-fame/leaderboard/${encodeURIComponent(catalog)}?limit=${limit}`);
    return response.data;
  }

  async getHallOfFameCatalogs(limit: number = 10): Promise<{ catalogs: any[]; total: number; }> {
    const response: AxiosResponse<{ catalogs: any[]; total: number; }> = 
      await this.client.get(`/hall-of-fame/catalogs?limit=${limit}`);
    return response.data;
  }

  async getMyHallOfFameEntries(limit: number = 50): Promise<{ entries: any[]; total: number; }> {
    const response: AxiosResponse<{ entries: any[]; total: number; }> = 
      await this.client.get(`/hall-of-fame/my-entries?limit=${limit}`);
    return response.data;
  }

  async getPlayerHallOfFameEntries(userId: number, limit: number = 10): Promise<{ userId: number; entries: any[]; total: number; isOwnData: boolean; }> {
    const response: AxiosResponse<{ userId: number; entries: any[]; total: number; isOwnData: boolean; }> = 
      await this.client.get(`/hall-of-fame/player/${userId}?limit=${limit}`);
    return response.data;
  }

  async addHallOfFameEntry(entry: Omit<HallOfFameEntry, 'id' | 'achieved_at'>): Promise<HallOfFameEntry> {
    const response: AxiosResponse<HallOfFameEntry> = await this.client.post('/hall-of-fame', entry);
    return response.data;
  }

  async getCatalogs(): Promise<Catalog[]> {
    const response: AxiosResponse<any[]> = await this.client.get('/question-sets');
    return response.data.map((qs: any) => ({
      name: qs.name,
      display_name: qs.description || qs.name,
      question_count: qs.question_count,
      created_at: qs.created_at
    }));
  }

  // Lobby endpoints
  async createLobby(lobbyData: CreateLobbyRequest): Promise<LobbyState> {
    const response: AxiosResponse<LobbyState> = await this.client.post('/lobbies/create', lobbyData);
    return response.data;
  }

  async joinLobby(code: string, player: JoinLobbyRequest): Promise<LobbyState> {
    const response: AxiosResponse<LobbyState> = await this.client.post(`/lobbies/${code}/join`, player);
    return response.data;
  }

  async leaveLobby(code: string, username: string): Promise<void> {
    await this.client.post(`/lobbies/${code}/leave`, { username });
  }

  async getLobby(code: string): Promise<LobbyState> {
    const response: AxiosResponse<LobbyState> = await this.client.get(`/lobbies/${code}`);
    return response.data;
  }

  async getLobbies(): Promise<LobbyState[]> {
    const response: AxiosResponse<LobbyState[]> = await this.client.get('/lobbies/list');
    return response.data;
  }

  async updateLobby(code: string, updates: Partial<LobbyState>): Promise<LobbyState> {
    const response: AxiosResponse<LobbyState> = await this.client.put(`/lobbies/${code}`, updates);
    return response.data;
  }

  async returnToLobby(code: string): Promise<LobbyState> {
    const response: AxiosResponse<LobbyState> = await this.client.post(`/lobbies/${code}/return-to-lobby`);
    return response.data;
  }

  async rejoinLobby(code: string): Promise<LobbyState> {
    const response: AxiosResponse<LobbyState> = await this.client.post(`/lobbies/${code}/rejoin-lobby`);
    return response.data;
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(endpoint);
    return response.data;
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(endpoint, data);
    return response.data;
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(endpoint);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient; 