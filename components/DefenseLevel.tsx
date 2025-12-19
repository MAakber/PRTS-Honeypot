
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArkPageHeader, ArkButton } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { 
    Shield, 
    Zap, 
    Activity, 
    AlertOctagon, 
    CheckCircle2, 
    Lock, 
    Cpu, 
    Wifi, 
    AlertTriangle,
    Siren,
    ChevronRight,
    Loader2,
    ShieldOff
} from 'lucide-react';
import { useNotification } from './NotificationSystem';

// Type definitions
type Level = -1 | 0 | 1 | 2 | 3;

interface LevelConfig {
    level: Level;
    color: string;
    icon: React.ElementType;
    firewallKey: string;
    aiKey: string;
    networkKey: string;
}

const LEVEL_CONFIGS: Record<Level, LevelConfig> = {
    [-1]: {
        level: -1,
        color: '#64748b', // Slate Gray
        icon: ShieldOff,
        firewallKey: 'dl_fw_minus1',
        aiKey: 'dl_ai_minus1',
        networkKey: 'dl_net_minus1'
    },
    0: {
        level: 0,
        color: '#23ade5', // Arknights Blue
        icon: Shield,
        firewallKey: 'dl_fw_0',
        aiKey: 'dl_ai_0',
        networkKey: 'dl_net_0'
    },
    1: {
        level: 1,
        color: '#eab308', // Yellow
        icon: AlertTriangle,
        firewallKey: 'dl_fw_1',
        aiKey: 'dl_ai_1',
        networkKey: 'dl_net_1'
    },
    2: {
        level: 2,
        color: '#f97316', // Orange
        icon: Zap,
        firewallKey: 'dl_fw_2',
        aiKey: 'dl_ai_2',
        networkKey: 'dl_net_2'
    },
    3: {
        level: 3,
        color: '#ef4444', // Red
        icon: Siren,
        firewallKey: 'dl_fw_3',
        aiKey: 'dl_ai_3',
        networkKey: 'dl_net_3'
    }
};

const PolicyCard: React.FC<{ title: string, value: string, icon: React.ElementType, color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-ark-bg/50 border border-ark-border p-4 flex flex-col gap-3 relative overflow-hidden group hover:border-opacity-100 transition-colors duration-300" style={{ borderColor: `${color}40` }}>
        {/* Decor Corner */}
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r transition-colors" style={{ borderColor: color }} />
        
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-ark-subtext uppercase tracking-widest">{title}</span>
            <Icon size={16} style={{ color }} className="opacity-80" />
        </div>
        <div className="font-bold text-ark-text text-sm md:text-base font-mono truncate">
            {value}
        </div>
        {/* Animated Bar */}
        <div className="w-full h-1 bg-ark-bg mt-1 overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-full opacity-20" style={{ backgroundColor: color }} />
            <div className="absolute top-0 left-0 h-full w-1/3 animate-[shimmer_2s_infinite]" style={{ backgroundColor: color }} />
        </div>
        <style>{`
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(300%); }
            }
        `}</style>
    </div>
);

export const DefenseLevel: React.FC = () => {
    const { lang } = useApp();
    const { notify } = useNotification();
    
    const [currentLevel, setCurrentLevel] = useState<Level>(0);
    const [selectedLevel, setSelectedLevel] = useState<Level>(0);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    const config = LEVEL_CONFIGS[selectedLevel];
    const isCurrent = currentLevel === selectedLevel;

    const handleActivate = () => {
        setIsConfirmOpen(true);
        setIsClosing(false);
    };

    const handleClose = () => {
        if (isActivating) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsConfirmOpen(false);
            setIsClosing(false);
        }, 200);
    };

    const confirmActivation = () => {
        setIsActivating(true);
        // Delay to show animation (2s to allow progress bar to fill)
        setTimeout(() => {
            setCurrentLevel(selectedLevel);
            setIsActivating(false);
            handleClose();
            const msg = selectedLevel === 3 ? t('dl_crisis_msg', lang) : t('dl_success_msg', lang);
            notify(selectedLevel >= 2 ? 'warning' : 'success', t('op_success', lang), msg);
        }, 2000);
    };

    const getLevelDisplay = (lvl: Level) => {
        if (lvl === -1) return "OFF";
        return `0${lvl}`;
    };

    const getLevelKeySuffix = (lvl: Level) => lvl === -1 ? 'minus1' : lvl;

    return (
        <div className="flex flex-col h-full bg-ark-bg border border-ark-border overflow-hidden relative">
            <ArkPageHeader 
                icon={<Shield size={24} />} 
                title={t('ad_level_title', lang)} 
                subtitle={t('ad_level_subtitle', lang)}
            />

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative z-10">
                {/* Left: Level Selector - Hidden Scrollbar */}
                <div className="w-full lg:w-80 bg-ark-panel border-b lg:border-b-0 lg:border-r border-ark-border flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto shrink-0 p-2 lg:p-4 gap-2 lg:gap-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                    {([-1, 0, 1, 2, 3] as Level[]).map((lvl) => {
                        const lvlConfig = LEVEL_CONFIGS[lvl];
                        const isActive = selectedLevel === lvl;
                        const isSystemCurrent = currentLevel === lvl;

                        return (
                            <button
                                key={lvl}
                                onClick={() => setSelectedLevel(lvl)}
                                className={`
                                    relative flex flex-col lg:flex-row items-center lg:items-start p-3 lg:p-4 border transition-all duration-300 group min-w-[120px] lg:w-full lg:min-h-[100px]
                                    ${isActive 
                                        ? 'bg-ark-active/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]' 
                                        : 'bg-transparent hover:bg-ark-active/5 opacity-70 hover:opacity-100'}
                                `}
                                style={{ 
                                    borderColor: isActive ? lvlConfig.color : 'transparent',
                                    borderLeftWidth: isActive ? '4px' : '1px',
                                }}
                            >
                                {/* Level Number - Big */}
                                <div className="text-3xl font-bold font-mono opacity-20 absolute right-2 bottom-0 pointer-events-none transition-colors" style={{ color: isActive ? lvlConfig.color : 'var(--ark-subtext)' }}>
                                    {getLevelDisplay(lvl)}
                                </div>

                                <div className="flex flex-col items-center lg:items-start gap-1 lg:gap-2 w-full relative z-10">
                                    <div className="flex items-center gap-2">
                                        <lvlConfig.icon size={18} style={{ color: isActive ? lvlConfig.color : 'var(--ark-subtext)' }} />
                                        <span className="text-sm font-bold uppercase tracking-wider" style={{ color: isActive ? lvlConfig.color : 'var(--ark-text)' }}>
                                            {t(`dl_level_${getLevelKeySuffix(lvl)}`, lang).split(' (')[0]}
                                        </span>
                                    </div>
                                    
                                    {isSystemCurrent && (
                                        <div className="flex items-center gap-1 mt-1 lg:mt-2 bg-ark-bg/80 px-2 py-0.5 rounded-sm border border-ark-border">
                                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: lvlConfig.color }} />
                                            <span className="text-[9px] font-mono uppercase tracking-widest text-ark-text">{t('dl_status_active', lang)}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right: Detail View - Hidden Scrollbar */}
                <div className="flex-1 bg-ark-bg/50 p-4 lg:p-8 relative flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                    {/* Background Watermark */}
                    <div className="absolute right-0 bottom-0 text-[20rem] font-bold font-mono text-ark-text opacity-[0.03] pointer-events-none select-none leading-none -mb-12 -mr-8">
                        {getLevelDisplay(selectedLevel)}
                    </div>

                    {/* Header Info */}
                    <div className="flex flex-col gap-6 relative z-10 mb-8">
                        <div className="flex items-start justify-between border-b border-ark-border pb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-mono text-ark-subtext uppercase tracking-[0.2em]">{t('dl_protocol_config', lang)}</span>
                                    <div className="h-[1px] flex-1 bg-ark-border w-12" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold font-mono uppercase tracking-tighter" style={{ color: config.color }}>
                                    {t(`dl_level_${getLevelKeySuffix(selectedLevel)}`, lang)}
                                </h1>
                            </div>
                            <div className="hidden md:block">
                                <AlertOctagon size={48} style={{ color: config.color, opacity: 0.2 }} />
                            </div>
                        </div>

                        {/* Description Box */}
                        <div className="bg-ark-panel border-l-4 p-6 shadow-sm" style={{ borderLeftColor: config.color }}>
                            <p className="text-sm md:text-base text-ark-text font-mono leading-relaxed">
                                {t(`dl_desc_${getLevelKeySuffix(selectedLevel)}`, lang)}
                            </p>
                        </div>
                    </div>

                    {/* Policy Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
                        <PolicyCard 
                            title={t('dl_policy_fw', lang)} 
                            value={t(config.firewallKey, lang)}
                            icon={Lock}
                            color={config.color}
                        />
                        <PolicyCard 
                            title={t('dl_policy_ai', lang)} 
                            value={t(config.aiKey, lang)}
                            icon={Cpu}
                            color={config.color}
                        />
                        <PolicyCard 
                            title={t('dl_policy_net', lang)} 
                            value={t(config.networkKey, lang)}
                            icon={Wifi}
                            color={config.color}
                        />
                    </div>

                    {/* Action Footer */}
                    <div className="mt-auto pt-6 border-t border-ark-border flex items-center justify-between relative z-10 bg-ark-bg/90 backdrop-blur-sm lg:bg-transparent">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-ark-subtext uppercase tracking-widest">{t('dl_current_status', lang)}</span>
                            <div className="flex items-center gap-2 font-mono font-bold text-lg">
                                {isCurrent ? (
                                    <span className="text-green-500 flex items-center gap-2"><CheckCircle2 size={18}/> {t('dl_status_active', lang)}</span>
                                ) : (
                                    <span className="text-ark-subtext">{t('dl_status_inactive', lang)}</span>
                                )}
                            </div>
                        </div>

                        {!isCurrent && (
                            <button
                                onClick={handleActivate}
                                className="relative group overflow-hidden px-8 py-3 h-14 flex items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] -skew-x-12 border-2 backdrop-blur-sm"
                                style={{ 
                                    borderColor: config.color,
                                    backgroundColor: `${config.color}15`,
                                    boxShadow: `0 0 20px ${config.color}20`,
                                    ['--level-color' as any]: config.color
                                }}
                            >
                                {/* Hover Fill Effect (Sliding) */}
                                <div 
                                    className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out"
                                    style={{ backgroundColor: config.color }}
                                />

                                {/* Decorative Scanning Glint - Fixed Animation */}
                                <div className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 blur-md animate-[scan_3s_ease-in-out_infinite]" />

                                {/* Content (Un-skewed) */}
                                <div className="relative z-10 flex items-center gap-3 font-bold uppercase tracking-widest text-[var(--level-color)] group-hover:text-black transition-colors duration-300 skew-x-12">
                                    <div className="p-1 border border-current rounded-sm">
                                        <Zap size={18} className="animate-pulse" />
                                    </div>
                                    <div className="flex flex-col items-start leading-none">
                                        <span className="text-[10px] opacity-70 font-mono mb-0.5">PROTOCOL_Override</span>
                                        <span className="text-sm">{t('dl_btn_activate', lang)}</span>
                                    </div>
                                </div>
                                
                                {/* Decorative Tech Squares (Un-skewed to maintain shape) */}
                                <div className="absolute top-0 right-1 p-1 skew-x-12">
                                     <div className="w-1.5 h-1.5 bg-current group-hover:text-black transition-colors" style={{ color: config.color }} />
                                </div>
                                <div className="absolute bottom-0 left-1 p-1 skew-x-12">
                                     <div className="w-1.5 h-1.5 bg-current group-hover:text-black transition-colors" style={{ color: config.color }} />
                                </div>
                                
                                <style>{`
                                    @keyframes scan {
                                        0% { left: -100%; }
                                        100% { left: 200%; }
                                    }
                                `}</style>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal - Interactive & Animated */}
            {isConfirmOpen && createPortal(
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
                    
                    <div 
                        className={`
                            relative w-full max-w-md bg-ark-panel border-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col p-1 transition-all duration-300
                            ${isClosing ? 'animate-ark-modal-out' : 'animate-ark-modal-in'}
                        `}
                        style={{ borderColor: config.color, minHeight: '300px' }}
                    >
                        {/* Decorative Header Bar */}
                        <div className="h-1 w-full mb-1" style={{ backgroundColor: config.color }} />
                        
                        {isActivating ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
                                {/* Hexagon Spinner Animation */}
                                <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                                     {/* Spinning Borders */}
                                     <div className="absolute inset-0 border-4 border-t-transparent border-b-transparent rounded-full animate-spin" style={{ borderColor: `${config.color} transparent`, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: config.color, borderRightColor: config.color }}></div>
                                     <div className="absolute inset-2 border-2 border-t-transparent border-b-transparent rounded-full animate-spin-reverse opacity-50" style={{ borderColor: `${config.color} transparent`, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: config.color, borderRightColor: config.color, animationDirection: 'reverse', animationDuration: '2s' }}></div>
                                     <AlertOctagon size={32} style={{ color: config.color }} className="animate-pulse" />
                                </div>
                                
                                <h3 className="text-xl font-bold text-ark-text mb-2 uppercase tracking-widest animate-pulse font-mono">
                                    {t('dl_processing', lang)}
                                </h3>
                                
                                {/* Progress Bar */}
                                <div className="w-full h-1 bg-ark-bg mt-4 relative overflow-hidden rounded-full">
                                    <div className="absolute inset-y-0 left-0 bg-ark-primary animate-[progress_2s_ease-in-out_forwards]" style={{ backgroundColor: config.color, width: '100%' }} />
                                </div>
                                <div className="flex justify-between w-full text-[10px] font-mono text-ark-subtext mt-2 opacity-70">
                                    <span>{t('dl_verifying', lang)}</span>
                                    <span>{t('dl_writing', lang)}</span>
                                </div>
                                <style>{`
                                    @keyframes progress {
                                        0% { width: 0%; }
                                        30% { width: 40%; }
                                        70% { width: 60%; }
                                        100% { width: 100%; }
                                    }
                                `}</style>
                            </div>
                        ) : (
                            <div className="p-6 text-center flex-1 flex flex-col justify-center animate-in fade-in duration-300">
                                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 border-2" style={{ borderColor: config.color, backgroundColor: `${config.color}20` }}>
                                    <AlertOctagon size={32} style={{ color: config.color }} />
                                </div>
                                
                                <h3 className="text-xl font-bold text-ark-text mb-2 uppercase tracking-widest">{t('dl_confirm_title', lang)}</h3>
                                <p className="text-sm text-ark-subtext font-mono mb-8 leading-relaxed">
                                    {t('dl_confirm_msg', lang)} <br/>
                                    <span className="text-ark-text font-bold mt-2 block">
                                        {t(`dl_level_${getLevelKeySuffix(currentLevel)}`, lang)} <ChevronRight size={12} className="inline"/> <span style={{ color: config.color }}>{t(`dl_level_${getLevelKeySuffix(selectedLevel)}`, lang)}</span>
                                    </span>
                                </p>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleClose}
                                        className="flex-1 py-3 text-xs font-bold uppercase tracking-widest border border-ark-border hover:bg-ark-active/10 transition-colors text-ark-subtext hover:text-ark-text"
                                    >
                                        {t('btn_cancel', lang)}
                                    </button>
                                    <button 
                                        onClick={confirmActivation}
                                        className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-black hover:brightness-110 transition-colors shadow-lg"
                                        style={{ backgroundColor: config.color }}
                                    >
                                        {t('btn_confirm', lang)}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
