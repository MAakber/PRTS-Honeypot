
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Target, ShieldAlert, Wifi } from 'lucide-react';
import { useApp } from '../AppContext';
import { t } from '../i18n';

// Approximate polygon paths for hover detection (ViewBox 0 0 1000 500)
export const REGION_HIT_AREAS = [
    { 
        id: 'us', 
        nameKey: 'region_na', 
        code: 'US',
        count: 846, 
        threat: 'CRITICAL',
        topIp: '162.142.125.28',
        path: "M 50 50 L 350 50 L 320 250 L 100 200 Z" 
    },
    { 
        id: 'cn', 
        nameKey: 'region_ea', 
        code: 'CN',
        count: 126, 
        threat: 'HIGH',
        topIp: '115.231.78.0',
        path: "M 680 140 L 820 140 L 800 250 L 650 220 Z" 
    },
    { 
        id: 'ru', 
        nameKey: 'region_ru', 
        code: 'RU',
        count: 125, 
        threat: 'HIGH',
        topIp: '87.236.176.0',
        path: "M 500 40 L 950 40 L 920 130 L 500 130 Z" 
    },
    { 
        id: 'eu', 
        nameKey: 'region_eu', 
        code: 'EU',
        count: 45, 
        threat: 'MEDIUM',
        topIp: '89.11.23.44',
        path: "M 450 80 L 550 80 L 550 150 L 420 140 Z" 
    },
    { 
        id: 'tr', 
        nameKey: 'region_me', 
        code: 'TR',
        count: 110, 
        threat: 'HIGH',
        topIp: '185.247.137.0',
        path: "M 520 150 L 620 150 L 600 200 L 500 180 Z" 
    }
];

export const ImageWorldMap: React.FC<{ onClick?: () => void, className?: string }> = ({ onClick, className = "w-full h-full" }) => {
    const { lang, darkMode } = useApp();
    const [hoveredRegion, setHoveredRegion] = useState<typeof REGION_HIT_AREAS[0] | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div 
            className={`relative overflow-hidden group cursor-pointer bg-ark-panel border border-ark-border/30 hover:border-ark-primary/50 transition-colors ${className}`}
            onClick={onClick}
            onMouseMove={handleMouseMove}
        >
            {/* Header Statistics */}
            <div className="absolute top-5 left-0 w-full z-20 flex justify-center items-center pointer-events-none select-none">
                <div className="flex items-center gap-6 bg-ark-panel/60 backdrop-blur-[2px] px-8 py-2 rounded-sm border-b-0 border-ark-border/10">
                    <div className="flex items-baseline gap-2 text-ark-text">
                        <span className="text-sm font-bold tracking-wider opacity-80">{t('map_global', lang)}</span>
                        <span className="text-3xl font-bold font-mono text-ark-danger leading-none">49</span>
                        <span className="text-sm font-bold tracking-wider opacity-80">{t('map_countries_attacking', lang)}</span>
                    </div>
                    <div className="h-6 w-[1px] bg-ark-subtext/30"></div>
                    <div className="flex items-baseline gap-2 text-ark-text">
                        <span className="text-sm font-bold tracking-wider opacity-80">{t('map_total', lang)}</span>
                        <span className="text-3xl font-bold font-mono text-ark-danger leading-none">3133</span>
                        <span className="text-sm font-bold tracking-wider opacity-80">{t('map_times', lang)}</span>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative w-full h-full">
                
                {/* 1. Background Image with CSS Filters */}
                <div 
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                        backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg)',
                        backgroundSize: '100% auto', 
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        filter: darkMode 
                            ? 'invert(0.9) grayscale(1) contrast(1.2) brightness(0.4)' 
                            : 'grayscale(1) opacity(0.3) contrast(1.1)',
                        opacity: darkMode ? 0.6 : 1
                    }}
                />

                {/* 2. Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.2]" 
                    style={{
                        backgroundImage: `linear-gradient(${darkMode ? '#fff' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? '#fff' : '#000'} 1px, transparent 1px)`,
                        backgroundSize: '30px 30px'
                    }}
                />

                {/* 3. Interactive Region Overlay (Invisible SVG) */}
                <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 1000 500" preserveAspectRatio="none">
                    {REGION_HIT_AREAS.map(region => (
                        <path 
                            key={region.id}
                            d={region.path}
                            fill="transparent"
                            className="cursor-crosshair hover:fill-ark-primary/10 transition-colors duration-150"
                            stroke="none"
                            onMouseEnter={() => setHoveredRegion(region)}
                            onMouseLeave={() => setHoveredRegion(null)}
                        />
                    ))}
                </svg>

            </div>

            {/* Scanning Line Effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-ark-primary/5 to-transparent h-[10%] w-full animate-scan" style={{ animationDuration: '3s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' }}></div>
            <style>{`
                @keyframes scan {
                    0% { top: -10%; }
                    100% { top: 110%; }
                }
            `}</style>

            {/* Tactical Tooltip using Portal to avoid clipping */}
            {hoveredRegion && createPortal(
                <div 
                    className="fixed z-[100] pointer-events-none"
                    style={{ 
                        left: mousePos.x + 20, 
                        top: mousePos.y + 20 
                    }}
                >
                    <div className="bg-ark-panel/95 backdrop-blur-md border border-ark-primary p-0 shadow-[0_0_15px_rgba(0,0,0,0.5)] min-w-[200px] text-xs">
                        {/* Decorative Corners */}
                        <div className="absolute top-0 left-0 w-1 h-1 bg-ark-primary"></div>
                        <div className="absolute top-0 right-0 w-1 h-1 bg-ark-primary"></div>
                        <div className="absolute bottom-0 left-0 w-1 h-1 bg-ark-primary"></div>
                        <div className="absolute bottom-0 right-0 w-1 h-1 bg-ark-primary"></div>

                        {/* Header */}
                        <div className="bg-ark-primary/10 px-3 py-2 border-b border-ark-primary/30 flex justify-between items-center">
                            <span className="font-bold font-mono text-ark-primary uppercase tracking-wider">{t(hoveredRegion.nameKey as any, lang)}</span>
                            <span className="bg-ark-danger text-white px-1 text-[10px] font-mono">{hoveredRegion.code}</span>
                        </div>
                        
                        {/* Body */}
                        <div className="p-3 space-y-2 font-mono text-ark-text">
                            <div className="flex justify-between items-center">
                                <span className="text-ark-subtext flex items-center gap-1"><Target size={10} /> {t('map_threat_lvl', lang)}</span>
                                <span className="text-ark-danger font-bold blink">{hoveredRegion.threat}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-ark-subtext flex items-center gap-1"><ShieldAlert size={10} /> {t('map_events', lang)}</span>
                                <span className="text-ark-text font-bold text-lg">{hoveredRegion.count}</span>
                            </div>
                            <div className="h-[1px] bg-ark-border my-1"></div>
                            <div>
                                <span className="text-[10px] text-ark-subtext block mb-1 uppercase tracking-wider">{t('map_major_source', lang)}</span>
                                <span className="text-ark-primary break-all">{hoveredRegion.topIp}</span>
                            </div>
                            <div className="mt-2 text-[10px] text-ark-subtext flex items-center gap-1">
                                <Wifi size={10} className="animate-pulse" />
                                <span>{t('map_uplink_established', lang)}</span>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
