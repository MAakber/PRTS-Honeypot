
import React, { useState } from 'react';
import { ArkButton } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { MOCK_ATTACK_SOURCES } from '../constants';
import { Users, X, AlertTriangle, Radar, Trash2, User, ChevronLeft, ChevronRight, Target, Search, Shield } from 'lucide-react';
import { ArkDateRangePicker } from './ArkDateRangePicker';
import { useNotification } from './NotificationSystem';

const FilterInput: React.FC<{ label?: string, placeholder?: string, width?: string, children?: React.ReactNode }> = ({ label, placeholder, width = "w-full", children }) => (
    <div className={`flex items-center border border-ark-border bg-ark-panel h-[32px] ${width}`}>
        {label && (
            <div className="px-3 text-xs text-ark-subtext font-mono whitespace-nowrap border-r border-ark-border h-full flex items-center bg-ark-bg/30">
                {label}
            </div>
        )}
        <div className="flex-1 min-w-0 h-full flex items-center relative">
            {children || <input type="text" placeholder={placeholder} className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text placeholder-ark-subtext/50" />}
        </div>
    </div>
);

const FilterSelect: React.FC<{ options: string[] }> = ({ options }) => (
    <select className="w-full h-full px-2 bg-transparent outline-none text-xs text-ark-text appearance-none cursor-pointer">
        {options.map((opt, i) => <option key={i}>{opt}</option>)}
    </select>
);

const SourceTracingVisual = () => {
    const { lang } = useApp();
    return (
        <div className="relative w-48 h-24 hidden lg:flex items-center justify-center select-none pointer-events-none mr-4">
            <div className="absolute w-24 h-24 border border-ark-primary/30 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 border border-ark-primary/50 rounded-full"></div>
            </div>
            <div className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-ark-primary/50 to-transparent"></div>
            <div className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-ark-primary/50 to-transparent"></div>
            <Target className="text-ark-danger relative z-10" size={24} />
            <div className="absolute top-2 right-2 text-[10px] text-ark-primary font-mono animate-pulse">{t('as_link', lang).split(':')[0]}</div>
        </div>
    );
};

export const AttackSource: React.FC = () => {
    const { lang, modules, toggleModule } = useApp();
    const { notify } = useNotification();
    const enabled = modules.attackSource;
    const [dateRange, setDateRange] = useState({ start: '2025-11-20T00:00', end: '2025-12-06T23:59' });

    const handleToggle = () => {
        const newState = !enabled;
        toggleModule('attackSource');
        notify(newState ? 'success' : 'warning', t('op_success', lang), newState ? t('msg_module_on', lang) : t('msg_module_off', lang));
    };

    return (
        <div className="flex flex-col gap-4 pb-6 min-h-full">
            {/* Header */}
            <div className="bg-ark-panel border border-ark-border shadow-sm relative transition-all duration-300">
                <div className={`absolute top-0 left-0 h-full bg-ark-primary transition-all duration-300 ease-out ${enabled ? 'w-1 opacity-100' : 'w-0 opacity-0'}`} />
                
                <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                    <div className="relative z-10 flex-1 w-full max-w-4xl">
                        <div className="flex items-center gap-4 mb-4 flex-wrap">
                            <div className="p-2 bg-ark-active/20 rounded-sm text-ark-primary border border-ark-primary/20 shrink-0">
                                <Radar size={20} className="md:w-6 md:h-6" />
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-ark-text">{t('as_title', lang)}</h2>
                            <button 
                                onClick={handleToggle}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 cursor-pointer ml-2 ${enabled ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
                            >
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <p className="text-xs text-ark-text/80 font-mono leading-relaxed w-full">
                            {t('as_desc', lang)}
                        </p>
                    </div>
                    <SourceTracingVisual />
                </div>
            </div>

            {/* Filters */}
            <div className="bg-ark-panel border border-ark-border p-4 shadow-sm space-y-4">
                 <div className="flex flex-col xl:flex-row gap-3">
                     <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                         <div className="lg:col-span-1">
                            <ArkDateRangePicker value={dateRange} onChange={setDateRange} className="w-full" />
                         </div>
                         <FilterInput label={t('filter_comprehensive', lang)} placeholder={t('filter_placeholder_search', lang)} />
                         <FilterInput label={t('filter_attack_scenario', lang)}>
                             <FilterSelect options={[t('filter_all', lang)]} />
                         </FilterInput>
                         <FilterInput label={t('filter_hfish_level', lang)}>
                             <FilterSelect options={[t('filter_all', lang), t('val_high', lang), t('val_medium', lang), t('val_low', lang)]} />
                         </FilterInput>
                     </div>
                     <div className="flex gap-2">
                         <ArkButton variant="ghost" className="h-[32px] px-4 whitespace-nowrap">
                            <X size={14} className="mr-1" /> {t('filter_reset', lang)}
                         </ArkButton>
                     </div>
                 </div>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col min-h-[500px] bg-ark-panel border border-ark-border overflow-hidden shadow-sm relative">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                     <table className="w-full text-left text-sm min-w-[1400px]">
                         <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase shadow-sm border-b border-ark-border sticky top-0 z-10 backdrop-blur-md">
                             <tr>
                                 <th className="p-4 whitespace-nowrap">{t('col_attack_ip', lang)}</th>
                                 <th className="p-4 whitespace-nowrap">{t('col_threat_verdict', lang)}</th>
                                 <th className="p-4 whitespace-nowrap">{t('col_micro_intel', lang)}</th>
                                 <th className="p-4 whitespace-nowrap">{t('col_behavior_detect', lang)}</th>
                                 <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none">{t('col_attack_total', lang)} ↕</th>
                                 <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none">{t('col_scan_total', lang)} ↕</th>
                                 <th className="p-4 whitespace-nowrap">{t('col_attacked_nodes', lang)}</th>
                                 <th className="p-4 whitespace-nowrap">{t('col_first_record', lang)}</th>
                                 <th className="p-4 whitespace-nowrap text-center">{t('col_operation', lang)}</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-ark-border font-mono text-xs">
                             {MOCK_ATTACK_SOURCES.map((item) => (
                                 <tr key={item.id} className="hover:bg-ark-active/5 transition-colors group">
                                     <td className="p-4">
                                         <div className="flex items-center gap-2">
                                             <span className="font-bold text-ark-text">{item.ip}</span>
                                             <span className="text-[10px] bg-ark-subtext/20 text-ark-subtext px-1 rounded-sm border border-ark-border">{item.country}</span>
                                         </div>
                                     </td>
                                     <td className="p-4">
                                         <span className={`px-2 py-0.5 border text-[10px] rounded-sm uppercase font-bold ${
                                             item.verdict === 'high' ? 'border-red-500/50 text-red-500 bg-red-500/10' :
                                             item.verdict === 'medium' ? 'border-orange-500/50 text-orange-500 bg-orange-500/10' :
                                             'border-ark-subtext/50 text-ark-subtext bg-ark-subtext/10'
                                         }`}>
                                             {item.verdict === 'high' ? t('val_high', lang) : item.verdict === 'medium' ? t('val_medium', lang) : t('val_unknown', lang)}
                                         </span>
                                     </td>
                                     <td className="p-4">
                                         <div className="flex gap-1">
                                             {item.tags?.map((tag, i) => (
                                                 <span key={i} className="px-1 py-0.5 bg-ark-active/10 text-ark-primary text-[10px] rounded-sm border border-ark-primary/20">
                                                     {tag === 'scan' ? t('btn_scan', lang) : tag === 'trash_mail' ? t('btn_trash', lang) : tag === 'dynamic_ip' ? t('btn_dynamic', lang) : tag}
                                                 </span>
                                             )) || <span className="text-ark-subtext">-</span>}
                                         </div>
                                     </td>
                                     <td className="p-4 text-ark-subtext">-</td>
                                     <td className="p-4 text-ark-text font-bold">{item.attackCount}</td>
                                     <td className="p-4 text-ark-text font-bold">{item.scanCount}</td>
                                     <td className="p-4 text-ark-subtext">
                                         {item.nodes.map(n => n === 'Internal Node' ? t('val_builtin_node', lang) : n).join(', ')}
                                     </td>
                                     <td className="p-4 text-ark-subtext">{item.firstTime}</td>
                                     <td className="p-4">
                                         <div className="flex items-center justify-center gap-3">
                                             <button className="text-ark-subtext hover:text-ark-primary transition-colors" title={t('btn_analyze', lang)}>
                                                 <Shield size={16} />
                                             </button>
                                             <button className="text-ark-subtext hover:text-ark-danger transition-colors" title={t('btn_block', lang)}>
                                                 <AlertTriangle size={16} />
                                             </button>
                                         </div>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-ark-border bg-ark-bg flex justify-end items-center gap-4 text-xs font-mono text-ark-subtext">
                    <span>{t('total_records', lang)} {MOCK_ATTACK_SOURCES.length}</span>
                    <div className="flex gap-1">
                        <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors disabled:opacity-50" disabled><ChevronLeft size={12} /></button>
                        <button className="w-6 h-6 flex items-center justify-center border border-ark-primary bg-ark-primary text-black font-bold">1</button>
                        <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors disabled:opacity-50" disabled><ChevronRight size={12} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
