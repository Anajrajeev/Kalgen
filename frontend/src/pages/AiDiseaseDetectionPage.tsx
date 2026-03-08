import { useState, useRef } from 'react';
import { Camera, Sparkles, ImageIcon, UploadCloud } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useTranslation } from '../services/useTranslation';
import { apiClient } from '../services/api';
import { TranslatedText } from '../components/ui/TranslatedText';

export function AiDiseaseDetectionPage() {
    const { label } = useTranslation();
    const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string, file?: File, diseaseData?: any }>>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show image upload success in chat
        setMessages(prev => [...prev, { type: 'user', content: `Uploaded image: ${file.name}`, file }]);

        setIsUploading(true);
        try {
            const response = await apiClient.analyzePlantDisease(file);
            if (response.error) {
                setMessages(prev => [...prev, { type: 'ai', content: `Error analyzing image: ${response.error}` }]);
            } else if (response.data) {
                setMessages(prev => [...prev, {
                    type: 'ai',
                    content: label('aiDiseaseAnalysisResultTitle'),
                    diseaseData: response.data
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { type: 'ai', content: label('errorAnalyzingImage' as any) || 'An unexpected error occurred.' }]);
        } finally {
            setIsUploading(false);
            // clear the input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-AgriNiti-text leading-tight uppercase tracking-tight">{label('aiDiseaseDetectionTitle')}</h2>
                    <p className="mt-2 text-base text-AgriNiti-text-muted max-w-2xl leading-relaxed">
                        {label('aiDiseaseDetectionDesc')}
                    </p>
                </div>
            </header>

            <div className="mt-8">
                <Card className="p-8 bg-AgriNiti-primary/5 border-AgriNiti-primary/20">
                    <div className="text-center mb-8">
                        <Camera className="h-16 w-16 text-AgriNiti-primary mx-auto mb-6" />
                        <h3 className="text-2xl font-semibold text-AgriNiti-text mb-4">
                            {label('uploadPlantImageTitle')}
                        </h3>
                        <p className="text-lg text-AgriNiti-text-muted mb-6 max-w-2xl mx-auto">
                            {label('aiDiseaseDetectionDesc')}
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl border border-AgriNiti-border/50 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-AgriNiti-text">{label('aiDiseaseAnalysisResultTitle')}</h4>
                                <div className="flex items-center gap-2">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    <button onClick={handleUploadClick} disabled={isUploading} className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isUploading ? 'bg-gray-100 text-gray-400' : 'bg-AgriNiti-accent-gold/10 text-AgriNiti-accent-gold hover:bg-AgriNiti-accent-gold/20'}`}>
                                        {isUploading ? <UploadCloud className="h-4 w-4 animate-pulse" /> : <ImageIcon className="h-4 w-4" />}
                                        <span>{isUploading ? label('analyzing') : label('upload')}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="h-96 overflow-auto mb-4 space-y-3 p-4 bg-AgriNiti-bg/30 rounded-xl">
                                {messages.length === 0 && (
                                    <div className="text-center text-AgriNiti-text-muted py-8">
                                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>{label('uploadPlantImageTitle')}</p>
                                    </div>
                                )}
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.type === 'user'
                                                ? 'bg-AgriNiti-primary text-white'
                                                : 'bg-white border border-AgriNiti-border/50 text-AgriNiti-text'
                                                }`}
                                        >
                                            <p><TranslatedText text={message.content} /></p>
                                            {message.file && (
                                                <div className="mt-3 flex flex-col gap-2">
                                                    <img
                                                        src={URL.createObjectURL(message.file)}
                                                        alt="Uploaded plant"
                                                        className="h-40 w-40 object-cover rounded-lg border border-white/20 shadow-sm"
                                                    />
                                                    <div className="text-xs italic opacity-75 inline-flex items-center gap-1">
                                                        <ImageIcon className="h-3 w-3" /> {label('imageAttached')}
                                                    </div>
                                                </div>
                                            )}
                                            {message.diseaseData && (
                                                <div className="mt-3 space-y-2 border-t pt-2 border-gray-100">
                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                        <div>
                                                            <span className="font-semibold text-xs text-gray-500 uppercase">{label('plantTypeLabel')}</span>
                                                            <p className="font-medium text-blue-700"><TranslatedText text={message.diseaseData.plant_type} /></p>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-xs text-gray-500 uppercase">{label('detectionLabel')}</span>
                                                            <p className="font-medium text-red-600"><TranslatedText text={message.diseaseData.disease_detected} /></p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-1">
                                                        <span className="font-semibold text-xs text-gray-500 uppercase">{label('symptomsLabel')}</span>
                                                        <p className="text-gray-700 text-xs mt-1"><TranslatedText text={message.diseaseData.symptoms} /></p>
                                                    </div>

                                                    <div className="pt-1">
                                                        <span className="font-semibold text-xs text-gray-500 uppercase">{label('treatmentsLabel')}</span>
                                                        <p className="text-gray-700 text-xs mt-1"><TranslatedText text={message.diseaseData.treatment_suggestions} /></p>
                                                    </div>

                                                    <div className="flex items-center gap-4 pt-2">
                                                        <Badge tone={message.diseaseData.severity === 'high' ? 'error' : 'neutral'} className="text-xs">
                                                            <TranslatedText text={message.diseaseData.severity} /> {label('severityLabel')}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">Confidence: {(message.diseaseData.confidence_score * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
