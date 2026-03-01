import { CloudRain, Droplets, SunMedium } from 'lucide-react';
import { Card } from '../ui/Card';

export function WeatherWidget() {
  return (
    <Card className="flex items-center gap-4 p-4 bg-gradient-to-r from-AgriNiti-accent-blue/5 to-AgriNiti-accent-blue/10 border-AgriNiti-accent-blue/30">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-AgriNiti-accent-blue text-white shadow-soft-card">
        <SunMedium className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-AgriNiti-text-muted">
          Weather today
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-AgriNiti-text">29°C</span>
          <span className="text-xs text-AgriNiti-text-muted">Partly cloudy</span>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-AgriNiti-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CloudRain className="h-3.5 w-3.5 text-AgriNiti-accent-blue" />
            35% rain
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-AgriNiti-accent-blue" />
            62% humidity
          </span>
        </div>
      </div>
    </Card>
  );
}

