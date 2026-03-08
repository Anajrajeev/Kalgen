const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ai-bharath.us-east-1.elasticbeanstalk.com';

export interface TranslationRequest {
    text: string;
    source_language: string;
    target_language: string;
}

export interface TranslationResponse {
    translated_text: string;
}

class TranslationService {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    async translate(data: TranslationRequest): Promise<TranslationResponse> {
        const params = new URLSearchParams({
            text: data.text,
            source_language: data.source_language,
            target_language: data.target_language,
        });

        const response = await fetch(`${this.baseURL}/translate-text?${params.toString()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Translation failed with status: ${response.status}`);
        }

        return response.json();
    }
}

export const translationService = new TranslationService();
