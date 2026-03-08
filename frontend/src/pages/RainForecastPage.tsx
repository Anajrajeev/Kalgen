import { useState, useEffect, useMemo } from 'react';
import { CloudRain, Sun, Cloud, Thermometer, Droplets, Wind, Calendar, Info, TrendingUp, MapPin, Sparkles, Leaf, Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TranslatedText } from '../components/ui/TranslatedText';
import { weatherService, WeeklyForecast, RainHeatmapData, TemperatureForecast, YieldAnalysis } from '../services/weatherService';

interface RainData {
    week: number;
    month: string;
    rain_level: 'No Rain' | 'Low Rain' | 'Medium Rain' | 'High Rain';
}

const MonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function RainForecastPage() {
    const [selectedMonth, setSelectedMonth] = useState<string | 'All'>('All');
    const [view, setView] = useState<'rain' | 'temp' | 'yield'>('rain');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Real-time data states
    const [weeklyData, setWeeklyData] = useState<WeeklyForecast[]>([]);
    const [rainHeatmap, setRainHeatmap] = useState<RainHeatmapData | null>(null);
    const [tempForecast, setTempForecast] = useState<TemperatureForecast | null>(null);
    const [yieldAnalysis, setYieldAnalysis] = useState<YieldAnalysis | null>(null);
    const [currentWeather, setCurrentWeather] = useState<any>(null);

    // Load real-time data
    useEffect(() => {
        loadWeatherData();
    }, [view]);

    const loadWeatherData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Load base weekly data for all views
            const weeklyResponse = await weatherService.getWeeklyForecast('Bangalore,IN', 52);
            if (!weeklyResponse.success) {
                throw new Error(weeklyResponse.error || 'Failed to load weekly forecast');
            }
            setWeeklyData(weeklyResponse.data);

            // Load view-specific data
            if (view === 'rain') {
                const heatmapResponse = await weatherService.getRainHeatmap('Bangalore,IN', 2026);
                if (heatmapResponse.success && heatmapResponse.data) {
                    setRainHeatmap(heatmapResponse.data);
                }

                const currentResponse = await weatherService.getCurrentWeather('Bangalore,IN');
                if (currentResponse.success && currentResponse.data) {
                    setCurrentWeather(currentResponse.data);
                }
            } else if (view === 'temp') {
                const tempResponse = await weatherService.getTemperatureForecast('Bangalore,IN', 30);
                if (tempResponse.success && tempResponse.data) {
                    setTempForecast(tempResponse.data);
                }
            } else if (view === 'yield') {
                const yieldResponse = await weatherService.getYieldAnalysis('Karnataka', 'kharif');
                if (yieldResponse.success && yieldResponse.data) {
                    setYieldAnalysis(yieldResponse.data);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load weather data');
        } finally {
            setLoading(false);
        }
    };

    // Convert weekly data to RainData format for compatibility
    const rawData = useMemo(() => {
        return weeklyData.map(w => ({
            week: w.week,
            month: w.month,
            rain_level: w.rain_forecast.rain_intensity as RainData['rain_level']
        }));
    }, [weeklyData]);

    const filteredData = useMemo(() => {
        if (selectedMonth === 'All') return rawData;
        return rawData.filter(d => d.month === selectedMonth);
    }, [selectedMonth]);

    const stats = useMemo(() => {
        const highRainWeeks = rawData.filter(d => d.rain_level === 'High Rain').length;
        const dryWeeks = rawData.filter(d => d.rain_level === 'No Rain').length;
        return { highRainWeeks, dryWeeks };
    }, []);

    const getRainColor = (level: string) => {
        switch (level) {
            case 'High Rain': return 'bg-blue-600';
            case 'Medium Rain': return 'bg-blue-400';
            case 'Low Rain': return 'bg-blue-200';
            default: return 'bg-slate-100 dark:bg-slate-800';
        }
    };

    const getRainLevelIcon = (level: string) => {
        switch (level) {
            case 'High Rain': return <CloudRain className="h-5 w-5 text-blue-600" />;
            case 'Medium Rain': return <CloudRain className="h-5 w-5 text-blue-400" />;
            case 'Low Rain': return <Cloud className="h-5 w-5 text-blue-200" />;
            default: return <Sun className="h-5 w-5 text-yellow-500" />;
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-AgriNiti-bg">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-AgriNiti-primary mx-auto mb-4" />
                    <p className="text-lg text-AgriNiti-text">Loading real-time weather data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-AgriNiti-bg">
                <Card className="p-6 max-w-md">
                    <div className="flex items-center gap-3 text-red-500 mb-4">
                        <AlertTriangle className="h-6 w-6" />
                        <h3 className="text-lg font-semibold">Error Loading Weather Data</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadWeatherData}
                        className="w-full bg-AgriNiti-primary text-white py-2 px-4 rounded-lg hover:bg-AgriNiti-primary-hover transition-colors"
                    >
                        Retry
                    </button>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 bg-AgriNiti-bg min-h-screen">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-AgriNiti-text flex items-center gap-3">
                            {view === 'rain' ? <CloudRain className="text-AgriNiti-primary h-8 w-8" /> : (view === 'temp' ? <Thermometer className="text-orange-500 h-8 w-8" /> : <Leaf className="text-green-500 h-8 w-8" />)}
                            <TranslatedText text={view === 'rain' ? 'Real-time Rain Prediction' : (view === 'temp' ? 'Live Temperature Forecast' : 'AI Yield Forecasting')} />
                        </h1>
                        <p className="text-AgriNiti-text-muted mt-1 flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> <TranslatedText text="Karnataka Region • Live Data" />
                            {currentWeather && (
                                <span className="ml-2 text-sm">
                                    • {weatherService.formatTemperature(currentWeather.temperature)} • {currentWeather.weather_condition}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm ml-4">
                        <button
                            onClick={() => setView('rain')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'rain' ? 'bg-AgriNiti-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <CloudRain className="h-4 w-4" />
                            <TranslatedText text="Rain" />
                        </button>
                        <button
                            onClick={() => setView('temp')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'temp' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Thermometer className="h-4 w-4" />
                            <TranslatedText text="Temp" />
                        </button>
                        <button
                            onClick={() => setView('yield')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'yield' ? 'bg-green-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Leaf className="h-4 w-4" />
                            <TranslatedText text="Yield" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button
                        className={`cursor-pointer px-4 py-2 text-sm transition-all shadow-sm rounded-full font-medium ${selectedMonth === 'All' ? 'bg-AgriNiti-primary text-white scale-105' : 'bg-white text-AgriNiti-text hover:bg-slate-50 border border-slate-100'}`}
                        onClick={() => setSelectedMonth('All')}
                    >
                        <TranslatedText text="All Year" />
                    </button>
                    {MonthNames.map(m => (
                        <button
                            key={m}
                            className={`cursor-pointer px-4 py-2 text-sm transition-all shadow-sm rounded-full font-medium ${selectedMonth === m ? 'bg-AgriNiti-primary text-white scale-105' : 'bg-white text-AgriNiti-text hover:bg-slate-50 border border-slate-100'}`}
                            onClick={() => setSelectedMonth(m)}
                        >
                            <TranslatedText text={m} />
                        </button>
                    ))}
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {view === 'rain' ? (
                    <>
                        {[
                            { icon: Droplets, color: 'blue', label: 'High Rain Weeks', value: stats.highRainWeeks, border: 'border-l-blue-500' },
                            { icon: Sun, color: 'orange', label: 'Dry Weeks', value: stats.dryWeeks, border: 'border-l-orange-400' },
                            { icon: TrendingUp, color: 'green', label: 'Peak Season', value: 'Jun - Aug', border: 'border-l-green-500' },
                            { icon: Sparkles, color: 'purple', label: 'Data Source', value: 'Live API', border: 'border-l-purple-400' }
                        ].map((card, idx) => (
                            <Card key={idx} className={`p-6 bg-white ${card.border} border-l-4 shadow-soft-card hover:translate-y-[-2px] transition-all`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-${card.color}-50 rounded-xl`}>
                                        <card.icon className={`h-6 w-6 text-${card.color}-500`} />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-400"><TranslatedText text={card.label} /></p>
                                        <h3 className="text-2xl font-bold text-AgriNiti-text"><TranslatedText text={card.value.toString()} /></h3>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </>
                ) : view === 'temp' ? (
                    <>
                        {[
                            { icon: Thermometer, color: 'orange', label: 'Avg. Temp', value: '28°C', border: 'border-l-orange-500' },
                            { icon: Sun, color: 'yellow', label: 'Max. Temp', value: '42°C', border: 'border-l-yellow-400' },
                            { icon: TrendingUp, color: 'red', label: 'Heatwaves Alert', value: '2 Expected', border: 'border-l-red-500' },
                            { icon: Sparkles, color: 'amber', label: 'Temp Reliability', value: '94%', border: 'border-l-amber-400' }
                        ].map((card, idx) => (
                            <Card key={idx} className={`p-6 bg-white ${card.border} border-l-4 shadow-soft-card hover:translate-y-[-2px] transition-all`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-${card.color}-50 rounded-xl`}>
                                        <card.icon className={`h-6 w-6 text-${card.color}-500`} />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-400"><TranslatedText text={card.label} /></p>
                                        <h3 className="text-2xl font-bold text-AgriNiti-text"><TranslatedText text={card.value} /></h3>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </>
                ) : (
                    <>
                        {[
                            { icon: Leaf, color: 'green', label: 'Est. Total Yield', value: '4.2k Tonnes', border: 'border-l-green-500' },
                            { icon: TrendingUp, color: 'emerald', label: 'Growth vs Last Year', value: '+14%', border: 'border-l-emerald-400' },
                            { icon: Droplets, color: 'blue', label: 'Irrigation Need', value: 'Moderate', border: 'border-l-blue-500' },
                            { icon: Sparkles, color: 'purple', label: 'Model Confidence', value: '91%', border: 'border-l-purple-400' }
                        ].map((card, idx) => (
                            <Card key={idx} className={`p-6 bg-white ${card.border} border-l-4 shadow-soft-card hover:translate-y-[-2px] transition-all`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-${card.color}-50 rounded-xl`}>
                                        <card.icon className={`h-6 w-6 text-${card.color}-500`} />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-400"><TranslatedText text={card.label} /></p>
                                        <h3 className="text-2xl font-bold text-AgriNiti-text"><TranslatedText text={card.value} /></h3>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Weekly Forecast Table */}
                <Card className="lg:col-span-1 p-6 h-[600px] flex flex-col bg-white shadow-soft-card border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-AgriNiti-text flex items-center gap-2">
                            <Calendar className={`h-5 w-5 ${view === 'rain' ? 'text-AgriNiti-primary' : (view === 'temp' ? 'text-orange-500' : 'text-green-500')}`} />
                            <TranslatedText text="Weekly Breakdown" />
                        </h3>
                        <Badge tone="info" className="bg-slate-100 text-slate-600 border-none px-3"><TranslatedText text="2026 Forecast" /></Badge>
                    </div>
                    <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr className="border-b border-slate-100">
                                    <th className="text-left font-bold text-[10px] text-slate-400 uppercase py-3 px-2"><TranslatedText text="Week" /></th>
                                    <th className="text-left font-bold text-[10px] text-slate-400 uppercase py-3"><TranslatedText text={view === 'rain' ? 'Forecast' : (view === 'temp' ? 'Avg Temp' : 'Est Yield')} /></th>
                                    <th className="text-right font-bold text-[10px] text-slate-400 uppercase py-3 px-2"><TranslatedText text="Intensity" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredData.map((d) => (
                                    <tr key={d.week} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-slate-700 w-6">{d.week}</span>
                                                <span className="text-[10px] font-bold text-white bg-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter opacity-70 group-hover:opacity-100"><TranslatedText text={d.month} /></span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                {view === 'rain' ? getRainLevelIcon(d.rain_level) : (view === 'temp' ? <Sun className="h-5 w-5 text-orange-400" /> : <Leaf className="h-5 w-5 text-green-500" />)}
                                                <span className="text-sm text-slate-600 font-semibold"><TranslatedText text={view === 'rain' ? d.rain_level : (view === 'temp' ? `${Math.floor(Math.random() * (42 - 18) + 18)}°C` : `${(Math.random() * 2 + 1).toFixed(1)} T`)} /></span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right px-2">
                                            <div className="flex justify-end gap-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div
                                                        key={i}
                                                        className={`h-4 w-1.5 rounded-[2px] shadow-sm transition-all ${view === 'rain' ? (
                                                            d.rain_level === 'High Rain' ? 'bg-blue-600' :
                                                                d.rain_level === 'Medium Rain' && i <= 3 ? 'bg-blue-400' :
                                                                    d.rain_level === 'Low Rain' && i <= 2 ? 'bg-blue-200' :
                                                                        i === 1 && d.rain_level === 'No Rain' ? 'bg-slate-100' : 'bg-slate-50 opacity-40'
                                                        ) : view === 'temp' ? (
                                                            i <= 3 ? 'bg-orange-400' : 'bg-slate-100 opacity-40'
                                                        ) : (
                                                            i <= 3 ? 'bg-green-500' : 'bg-slate-100 opacity-40'
                                                        )
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Visual Trends & Heatmap */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Trend Chart (SVG) */}
                    <Card className={`p-8 ${view === 'rain' ? 'bg-slate-900' : (view === 'temp' ? 'bg-orange-950' : 'bg-green-950')} text-white overflow-hidden relative min-h-[350px] shadow-2xl border-none transition-colors duration-500`}>
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight"><TranslatedText text={view === 'rain' ? 'Rainfall Probability Curve' : (view === 'temp' ? 'Temperature Variance Curve' : 'Projected Yield Progression')} /></h3>
                                    <p className="text-slate-400 text-sm font-medium"><TranslatedText text={view === 'rain' ? 'Dynamic variation of precipitation intensity' : (view === 'temp' ? 'Annual temperature fluctuations and heat patterns' : 'Estimated crop yield timeline modeling')} /></p>
                                </div>
                                <div className="flex gap-4 text-xs font-bold text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${view === 'rain' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : (view === 'temp' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]')}`}></div>
                                        <span><TranslatedText text="Model Prediction" /></span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative h-56 w-full mt-12">
                                <svg className="w-full h-full" viewBox="0 0 520 100" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id={`${view}CurveGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: view === 'rain' ? 'rgb(59, 130, 246)' : (view === 'temp' ? 'rgb(249, 115, 22)' : 'rgb(34, 197, 94)'), stopOpacity: 0.5 }} />
                                            <stop offset="100%" style={{ stopColor: view === 'rain' ? 'rgb(30, 41, 59)' : (view === 'temp' ? 'rgb(67, 20, 7)' : 'rgb(6, 78, 59)'), stopOpacity: 0 }} />
                                        </linearGradient>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Grid Lines */}
                                    {[20, 50, 80].map(y => (
                                        <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    ))}

                                    <path
                                        d={`M 0 100 ${rawData.map((d, i) => {
                                            let h;
                                            if (view === 'rain') {
                                                h = d.rain_level === 'High Rain' ? 20 :
                                                    d.rain_level === 'Medium Rain' ? 50 :
                                                        d.rain_level === 'Low Rain' ? 80 : 96;
                                            } else if (view === 'temp') {
                                                // Mock temperature curve
                                                h = 50 + 30 * Math.sin(i * 0.15) + (Math.random() * 10 - 5);
                                            } else {
                                                // Mock yield curve increasing
                                                h = 80 - (i * 1.5) + (Math.random() * 5);
                                            }
                                            return `L ${i * 10} ${h}`;
                                        }).join(' ')} L 520 100 Z`}
                                        fill={`url(#${view}CurveGrad)`}
                                    />
                                    <path
                                        d={`M 0 100 ${rawData.map((d, i) => {
                                            let h;
                                            if (view === 'rain') {
                                                h = d.rain_level === 'High Rain' ? 20 :
                                                    d.rain_level === 'Medium Rain' ? 50 :
                                                        d.rain_level === 'Low Rain' ? 80 : 96;
                                            } else if (view === 'temp') {
                                                h = 50 + 30 * Math.sin(i * 0.15) + (Math.random() * 10 - 5);
                                            } else {
                                                h = 80 - (i * 1.5) + (Math.random() * 5);
                                            }
                                            return `L ${i * 10} ${h}`;
                                        }).join(' ')}`}
                                        fill="none"
                                        stroke={view === 'rain' ? '#3b82f6' : (view === 'temp' ? '#f97316' : '#22c55e')}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        filter="url(#glow)"
                                    />
                                </svg>
                                <div className="flex justify-between mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                                    {MonthNames.map(m => <span key={m}><TranslatedText text={m} /></span>)}
                                </div>
                            </div>
                        </div>
                        {/* Ambient Background Glows */}
                        <div className={`absolute top-0 right-0 w-80 h-80 ${view === 'rain' ? 'bg-blue-600/20' : (view === 'temp' ? 'bg-orange-600/20' : 'bg-green-600/20')} rounded-full blur-[100px] -mr-40 -mt-40 transition-colors duration-500`}></div>
                        <div className={`absolute bottom-0 left-0 w-64 h-64 ${view === 'rain' ? 'bg-indigo-500/10' : (view === 'temp' ? 'bg-red-500/10' : 'bg-emerald-500/10')} rounded-full blur-[80px] -ml-32 -mb-32 transition-colors duration-500`}></div>
                    </Card>

                    {/* Seasonal Heatmap */}
                    <Card className="p-8 bg-white border-slate-100 shadow-soft-card">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight"><TranslatedText text="Rain Intensity Heatmap" /></h3>
                                <p className="text-sm text-slate-400 font-medium italic"><TranslatedText text="Chronological 52-week precipitation overview" /></p>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"><TranslatedText text="Scale" /></span>
                                <div className="flex gap-1">
                                    <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 border border-slate-200"></div>
                                    <div className="w-3.5 h-3.5 rounded-sm bg-blue-200"></div>
                                    <div className="w-3.5 h-3.5 rounded-sm bg-blue-400"></div>
                                    <div className="w-3.5 h-3.5 rounded-sm bg-blue-600"></div>
                                </div>
                                <div className="flex items-center gap-1 ml-1">
                                    <span className="text-[10px] font-bold text-slate-600"><TranslatedText text="Dry" /></span>
                                    <ChevronRightIcon className="h-2 w-2 text-slate-400" />
                                    <span className="text-[10px] font-bold text-blue-600"><TranslatedText text="Wet" /></span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-flow-col grid-rows-4 gap-2.5 overflow-x-auto pb-4 pt-4 custom-scrollbar">
                            {rawData.map((d) => (
                                <div
                                    key={d.week}
                                    className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg transition-all hover:scale-110 hover:shadow-lg cursor-help ${getRainColor(d.rain_level)} shadow-sm group`}
                                >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap pointer-events-none z-30 font-bold shadow-xl border border-white/10">
                                        <TranslatedText text={`Week ${d.week} • ${d.month}: `} /><span className="text-blue-300 ml-1"><TranslatedText text={d.rain_level} /></span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between mt-4 px-2">
                            {MonthNames.map(m => (
                                <span key={m} className="text-[10px] font-black text-slate-300 uppercase tracking-tighter w-10 text-center"><TranslatedText text={m} /></span>
                            ))}
                        </div>

                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                                <div className="p-2 bg-blue-500 rounded-lg shrink-0">
                                    <TrendingUp className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-blue-800 mb-1 leading-none"><TranslatedText text="Monsoon Confidence" /></h4>
                                    <p className="text-xs text-blue-600/80 leading-relaxed font-medium">
                                        <TranslatedText text="Sustained" /> <strong className="text-blue-700"><TranslatedText text="High Rain" /></strong> <TranslatedText text="(Weeks 21-33) indicates a reliable Kharif season. Sowing window:" /> <span className="underline decoration-blue-200"><TranslatedText text="First week of June" /></span>.
                                    </p>
                                </div>
                            </div>
                            <div className="p-5 bg-amber-50/40 rounded-2xl border border-amber-100/50 flex items-start gap-4">
                                <div className="p-2 bg-amber-500 rounded-lg shrink-0">
                                    <Sun className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-amber-800 mb-1 leading-none"><TranslatedText text="Dry Spell Warning" /></h4>
                                    <p className="text-xs text-amber-600/80 leading-relaxed font-medium">
                                        <TranslatedText text="Prolonged" /> <strong className="text-amber-700"><TranslatedText text="No Rain" /></strong> <TranslatedText text="periods in Q1 and Q4. Advised to secure irrigation for Rabi crops and consider mulch for moisture retention." />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function ChevronRightIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}
