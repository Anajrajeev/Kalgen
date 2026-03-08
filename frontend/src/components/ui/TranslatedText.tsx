import { useEffect, useState } from 'react';
import { useTranslation } from '../../services/useTranslation';

export function TranslatedText({ text }: { text: string }) {
    const { t, language } = useTranslation();
    const [translated, setTranslated] = useState(text);

    useEffect(() => {
        let mounted = true;

        async function translateText() {
            if (!text) return;
            const res = await t(text);
            if (mounted) {
                setTranslated(res);
            }
        }

        translateText();

        return () => {
            mounted = false;
        };
    }, [text, t, language]);

    return <>{translated}</>;
}
