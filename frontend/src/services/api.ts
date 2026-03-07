const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  username: string; // FastAPI OAuth2 expects username field for email
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  preferred_language?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API request error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/token-json', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async register(userData: RegisterData): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/auth/users/${userId}`);
  }

  async getUsername(): Promise<ApiResponse<{ username: string, email: string }>> {
    return this.request<{ username: string, email: string }>('/auth/username');
  }

  async updateCurrentUser(updateData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/health');
  }

  async getMarketplaceStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/v1/marketplace/stats');
  }

  async getListings(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/v1/marketplace/listings');
  }

  async createListing(listingData: any): Promise<ApiResponse<any>> {
    return this.request<any>('/v1/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  }

  // Chat Endpoints
  async getConversations(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/v1/chat/conversations');
  }

  async getChatHistory(receiverId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/v1/chat/history/${receiverId}`);
  }

  async sendMessage(msgData: { receiver_id: string, content: string, target_language: string }): Promise<ApiResponse<any>> {
    return this.request<any>('/v1/chat/send', {
      method: 'POST',
      body: JSON.stringify(msgData),
    });
  }

  // Voice/Speech Endpoints
  async textToSpeech(text: string, languageCode: string): Promise<ApiResponse<{ audio_url?: string, audio_base64?: string }>> {
    return this.request<any>('/tts/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text, language_code: languageCode }),
    });
  }

  async speechToText(audioData: Blob, languageCode: string): Promise<ApiResponse<{ text: string }>> {
    const formData = new FormData();
    formData.append('file', audioData);
    // Note: Request method in ApiClient needs adjustment for FormData, but for now assuming JSON.
    return this.request<any>(`/transcribe?language_code=${languageCode}`, {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }
}

export const apiClient = new ApiClient();
