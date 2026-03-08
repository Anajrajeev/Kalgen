import { useState, useRef } from 'react';
import { Droplets, Sparkles, ImageIcon, UploadCloud } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useTranslation } from '../services/useTranslation';
import { apiClient } from '../services/api';
import { TranslatedText } from '../components/ui/TranslatedText';

export function SoilAnalysisPage() {
    const { label } = useTranslation();
    const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string, file?: File, soilData?: any }>>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setMessages(prev => [...prev, { type: 'user', content: `Uploaded soil image: ${file.name}`, file }]);

        setIsUploading(true);
        try {
            const response = await apiClient.analyzeSoil(file);
            if (response.error) {
                setMessages(prev => [...prev, { type: 'ai', content: `Error analyzing image: ${response.error}` }]);
            } else if (response.data) {
                setMessages(prev => [...prev, {
                    type: 'ai',
                    content: 'Analysis Results',
                    soilData: response.data
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { type: 'ai', content: 'An unexpected error occurred.' }]);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-AgriNiti-text leading-tight uppercase tracking-tight">{label('soilAnalysisTitle')}</h2>
                    <p className="mt-2 text-base text-AgriNiti-text-muted max-w-2xl leading-relaxed">
                        {label('soilAnalysisDesc')}
                    </p>
                </div>
            </header>

            <div className="mt-8">
                <Card className="p-8 bg-AgriNiti-primary/5 border-AgriNiti-primary/20">
                    <div className="text-center mb-8">
                        <Droplets className="h-16 w-16 text-AgriNiti-primary mx-auto mb-6" />
                        <h3 className="text-2xl font-semibold text-AgriNiti-text mb-4">
                            Upload Soil Image for Analysis
                        </h3>
                        <p className="text-lg text-AgriNiti-text-muted mb-6 max-w-2xl mx-auto">
                            Our AI will analyze the soil texture and color from the image to estimate its properties, health, and recommend suitable crops.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl border border-AgriNiti-border/50 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-AgriNiti-text">Soil Analysis Results</h4>
                                <div className="flex items-center gap-2">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    <button onClick={handleUploadClick} disabled={isUploading} className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isUploading ? 'bg-gray-100 text-gray-400' : 'bg-AgriNiti-accent-blue/10 text-AgriNiti-accent-blue hover:bg-AgriNiti-accent-blue/20'}`}>
                                        {isUploading ? <UploadCloud className="h-4 w-4 animate-pulse" /> : <ImageIcon className="h-4 w-4" />}
                                        <span>{isUploading ? label('analyzing') : label('upload')}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="h-96 overflow-auto mb-4 space-y-3 p-4 bg-AgriNiti-bg/30 rounded-xl">
                                {messages.length === 0 && (
                                    <div className="text-center text-AgriNiti-text-muted py-8">
                                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Upload a clear image of your soil to begin analysis</p>
                                    </div>
                                )}
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-4 text-sm leading-relaxed ${message.type === 'user'
                                                ? 'bg-AgriNiti-primary text-white'
                                                : 'bg-white border border-AgriNiti-border/50 text-AgriNiti-text'
                                                }`}
                                        >
                                            <p className="font-semibold text-base mb-2"><TranslatedText text={message.content} /></p>
                                            {message.file && (
                                                <div className="mt-3 flex flex-col gap-2">
                                                    <img
                                                        src={URL.createObjectURL(message.file)}
                                                        alt="Uploaded soil"
                                                        className="h-40 w-40 object-cover rounded-lg border border-white/20 shadow-sm"
                                                    />
                                                    <div className="text-xs italic opacity-75 inline-flex items-center gap-1">
                                                        <ImageIcon className="h-3 w-3" /> {label('imageAttached')}
                                                    </div>
                                                </div>
                                            )}
                                            {message.soilData && (
                                                <div className="mt-3 space-y-3 border-t pt-3 border-gray-100">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="font-semibold text-xs text-gray-500 uppercase">Soil Type</span>
                                                            <p className="font-medium text-blue-700 capitalize mt-1"><TranslatedText text={message.soilData.soil_type?.replace(/_/g, ' ') || 'Unknown'} /></p>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-xs text-gray-500 uppercase">Color Analysis</span>
                                                            <p className="font-medium text-gray-700 mt-1"><TranslatedText text={message.soilData.color || 'N/A'} /></p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="font-semibold text-xs text-gray-500 uppercase">Est. pH Level</span>
                                                            <p className="mt-1 font-medium"><TranslatedText text={message.soilData.ph_level || 'N/A'} /></p>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-xs text-gray-500 uppercase">Nitrogen Level</span>
                                                            <p className="mt-1 font-medium"><TranslatedText text={message.soilData.nitrogen_level || 'N/A'} /></p>
                                                        </div>
                                                    </div>

                                                    {message.soilData.fertility_indicators && message.soilData.fertility_indicators.length > 0 && (
                                                        <div className="pt-2">
                                                            <span className="font-semibold text-xs text-gray-500 uppercase">Key Indicators</span>
                                                            <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-700">
                                                                {message.soilData.fertility_indicators.map((indicator: string, i: number) => (
                                                                    <li key={i}><TranslatedText text={indicator} /></li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {message.soilData.recommended_crops && message.soilData.recommended_crops.length > 0 && (
                                                        <div className="pt-2 mt-2 border-t border-gray-100">
                                                            <span className="font-semibold text-xs text-green-600 uppercase">Recommended Crops</span>
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {message.soilData.recommended_crops.map((crop: string, i: number) => (
                                                                    <Badge key={i} tone="success" className="text-xs">
                                                                        <TranslatedText text={crop} />
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {message.soilData.recommendations && message.soilData.recommendations.length > 0 && (
                                                        <div className="pt-2 mt-2 border-t border-gray-100">
                                                            <span className="font-semibold text-xs text-gray-500 uppercase">Actionable Advice</span>
                                                            <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-700">
                                                                {message.soilData.recommendations.map((rec: string, i: number) => (
                                                                    <li key={i}><TranslatedText text={rec} /></li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                                                        <Badge tone={message.soilData.confidence > 0.8 ? 'success' : 'warning'} className="text-xs">
                                                            Analysis Confidence
                                                        </Badge>
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            {(message.soilData.confidence * 100).toFixed(0)}% Certainty
                                                        </span>
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
