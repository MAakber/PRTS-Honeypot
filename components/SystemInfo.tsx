
import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { QrCode, Globe, Terminal } from 'lucide-react';

const ToggleSwitch: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => (
    <div 
        onClick={onChange}
        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300 ${checked ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
    >
        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
);

export const SystemInfo: React.FC = () => {
    const { lang } = useApp();
    const [cloudPlanEnabled, setCloudPlanEnabled] = useState(true);

    useEffect(() => {
        const fetchCloudPlan = async () => {
            try {
                const token = localStorage.getItem('prts_token');
                const res = await fetch('/api/v1/config', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.cloud_plan_enabled) {
                        setCloudPlanEnabled(data.cloud_plan_enabled === 'true');
                    }
                }
            } catch (e) {
                console.error("Failed to fetch cloud plan config", e);
            }
        };
        fetchCloudPlan();
    }, []);

    const handleToggleCloudPlan = async () => {
        const newValue = !cloudPlanEnabled;
        setCloudPlanEnabled(newValue);
        try {
            const token = localStorage.getItem('prts_token');
            await fetch('/api/v1/config', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ cloud_plan_enabled: newValue.toString() })
            });
        } catch (e) {
            console.error("Failed to save cloud plan config", e);
        }
    };

    return (
        <div className="bg-ark-panel border border-ark-border h-full flex flex-col md:flex-row overflow-hidden shadow-sm">
            {/* Main Content Area */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl space-y-8">
                    {/* Header Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-ark-text flex items-center gap-2">
                            {t('si_title', lang)} <span className="text-ark-subtext text-sm font-mono">{t('si_version', lang)}</span>
                        </h2>
                        <div className="text-sm text-ark-text leading-relaxed font-mono">
                            <p>{t('si_desc', lang)}</p>
                            <a href="https://hfish.net" target="_blank" rel="noopener noreferrer" className="block mt-2 text-ark-primary hover:underline">
                                {t('si_website', lang)}
                            </a>
                        </div>
                    </div>

                    {/* Community Section */}
                    <div className={`space-y-4 border-l-4 pl-4 transition-colors duration-300 ${cloudPlanEnabled ? 'border-ark-primary' : 'border-ark-subtext/20'}`}>
                        <h3 className="text-lg font-bold text-ark-text">{t('si_community_title', lang)}</h3>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h4 className="font-bold text-ark-text text-sm">{t('si_cloud_plan', lang)}</h4>
                                <ToggleSwitch checked={cloudPlanEnabled} onChange={handleToggleCloudPlan} />
                            </div>
                            <p className="text-xs text-ark-subtext leading-relaxed font-mono">
                                {t('si_cloud_desc', lang)}
                            </p>
                        </div>
                    </div>

                    {/* Disclaimer Section */}
                    <div className="space-y-4 border-l-4 border-ark-subtext/50 pl-4">
                        <h3 className="text-lg font-bold text-ark-text">{t('si_disclaimer_title', lang)}</h3>
                        <p className="text-xs text-ark-subtext leading-relaxed font-mono">
                            {t('si_disclaimer_text', lang)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Sidebar Area */}
            <div className="w-full md:w-80 bg-ark-bg/30 border-l border-ark-border p-6 flex flex-col gap-6">
                
                {/* Card 1: HFish Logo */}
                <div className="bg-ark-panel border border-ark-border p-6 shadow-sm flex flex-col items-center justify-center text-center gap-2 rounded-sm hover:border-ark-primary transition-colors">
                    <div className="flex items-center gap-2 text-red-500 font-bold text-2xl tracking-widest">
                        <Terminal size={32} />
                        PRTS
                    </div>
                    <span className="text-[10px] bg-ark-subtext/20 text-ark-subtext px-2 py-0.5 rounded-full font-mono">
                        {t('si_title', lang).split(' ')[0]} {/* Simplified for visuals */}
                    </span>
                </div>

                {/* Card 2: IPv6 */}
                <div className="bg-ark-panel border border-ark-border p-6 shadow-sm flex flex-col items-center justify-center text-center gap-3 rounded-sm hover:border-ark-primary transition-colors">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center border border-blue-500/30">
                        <Globe size={24} />
                    </div>
                    <span className="text-xs font-bold text-ark-text">
                        {t('si_card_ipv6', lang)}
                    </span>
                </div>

                {/* Card 3: Contact/QR */}
                <div className="bg-ark-panel border border-ark-border p-6 shadow-sm flex flex-col items-center justify-center text-center gap-4 rounded-sm hover:border-ark-primary transition-colors">
                    <span className="text-xs text-ark-subtext font-mono">
                        {t('si_card_contact', lang)}
                    </span>
                    <div className="w-32 h-32 bg-white p-2 border border-ark-border">
                        <QrCode size={110} className="text-black" />
                    </div>
                </div>

            </div>
        </div>
    );
};
