import { useCallback, useState, useEffect } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { labels, LabelKey } from '../i18n/labels';
import { translationService } from './translation';

export function useTranslation() {
    const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
    const [cache, setCache] = useState<Record<string, string>>({});

    const t = useCallback(
        async (text: string | LabelKey, isLabel: boolean = false): Promise<string> => {
            // 1. If it's a known label, return it immediately
            if (isLabel && labels[selectedLanguage] && (text as LabelKey) in labels[selectedLanguage]) {
                return labels[selectedLanguage][text as LabelKey];
            }

            // 2. If already in cache for this language
            const cacheKey = `${selectedLanguage}:${text}`;
            if (cache[cacheKey]) return cache[cacheKey];

            // 3. If English, just return original (assuming original is English)
            if (selectedLanguage === 'en') return text;

            // 4. Call translation service for dynamic content
            try {
                const response = await translationService.translate({
                    text,
                    target_language: selectedLanguage,
                    source_language: 'en'
                });

                const translated = response.translated_text;
                setCache(prev => ({ ...prev, [cacheKey]: translated }));
                return translated;
            } catch (err) {
                console.warn('Translation failed, falling back to English:', err);
                return text;
            }
        },
        [selectedLanguage, cache]
    );

    // Synchronous version for static labels
    const label = useCallback(
        (key: LabelKey): string => {
            const langLabels = labels[selectedLanguage] || labels['en'];
            return langLabels[key] || labels['en'][key] || key;
        },
        [selectedLanguage]
    );

    return { t, label, language: selectedLanguage };
}
