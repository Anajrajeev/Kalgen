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

  async getMarketplaceProfile(): Promise<ApiResponse<any>> {
    return this.request<any>('/v1/marketplace/profile/me');
  }

  async updateMarketplaceProfile(profileData: any): Promise<ApiResponse<any>> {
    return this.request<any>('/v1/marketplace/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  // --- Agriniti Endpoints ---

  // Market Prices
  async getMarketPrices(params: any = {}): Promise<ApiResponse<any>> {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/api/v1/mandi/prices?${query}`);
  }

  async getMarketStates(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/v1/mandi/states');
  }

  async getMarketCommodities(state?: string): Promise<ApiResponse<any>> {
    const url = state ? `/api/v1/mandi/commodities?state=${state}` : '/api/v1/mandi/commodities';
    return this.request<any>(url);
  }

  // Aliases for compatibility
  async getMandiPrices(params: any = {}) { return this.getMarketPrices(params); }
  async getMandiStates() { return this.getMarketStates(); }
  async getMandiCommodities(state?: string) { return this.getMarketCommodities(state); }

  // Agriniti Auth (Separate from main auth if needed, but often unified in UI)
  async agrinitiLogin(credentials: any): Promise<ApiResponse<any>> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    return this.request<any>('/agriniti/auth/login', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  // Agriniti Listings
  async getAgrinitiListings(params: any = {}): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/agriniti/listings?${query}`);
  }

  async createAgrinitiListing(data: any): Promise<ApiResponse<any>> {
    return this.request<any>('/agriniti/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyAgrinitiListings(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/agriniti/listings/mine');
  }

  async updateAgrinitiListingStatus(listingId: string, status: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/agriniti/listings/${listingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteAgrinitiListing(listingId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/agriniti/listings/${listingId}`, {
      method: 'DELETE',
    });
  }

  // Ranking & Recommendation
  async rankSellers(query: string, district?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ q: query });
    if (district) params.append('buyer_district', district);
    return this.request<any>(`/agriniti/rank/sellers?${params.toString()}`);
  }

  async matchBuyersForListing(listingId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/agriniti/rank/buyers-for-listing/${listingId}`);
  }

  // Ratings
  async submitRating(ratingData: { ratee_id: string, score: number, comment?: string }): Promise<ApiResponse<any>> {
    return this.request<any>('/agriniti/ratings', {
      method: 'POST',
      body: JSON.stringify(ratingData),
    });
  }

  async getUserRating(userId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/agriniti/ratings/user/${userId}`);
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
  // --- AI Advisory Endpoints ---
  async analyzePlantDisease(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<any>('/ai-advisory/analyze-plant-disease', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  async analyzeSoil(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image_file', file);
    return this.request<any>('/soil-advisory/soil-analysis', {
      method: 'POST',
      body: formData,
      headers: {}
    });
  }

  async queryKb(query: string, top_k: number = 3): Promise<ApiResponse<any>> {
    return this.request<any>('/ai-advisory/query', {
      method: 'POST',
      body: JSON.stringify({ query, top_k }),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async speechQuery(audioFile: Blob, language: string = 'auto', returnText: boolean = false): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('audio_file', audioFile, 'recording.webm');
    formData.append('language', language);
    formData.append('target_language', language);
    if (returnText) {
      formData.append('return_text', 'true');
    }

    return this.request<any>('/speech-advisory/speech-query', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }
}


export const apiClient = new ApiClient();
