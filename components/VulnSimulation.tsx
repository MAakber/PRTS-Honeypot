
import React, { useState, useEffect } from 'react';
import { ArkButton, ArkLoading } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { Lang } from '../types';
import { 
    Search, 
    X, 
    ChevronLeft, 
    ChevronRight, 
    Skull, 
    Server, 
    Search as SearchIcon, 
    FileText, 
    Edit, 
    Trash2,
    Activity,
    AlertTriangle,
    ShieldAlert,
    RefreshCw
} from 'lucide-react';
import { useNotification } from './NotificationSystem';

// Reusing Filter Components
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

// Flow Diagram Component
const FlowDiagram: React.FC<{ lang: Lang }> = ({ lang }) => {
    return (
        <div className="hidden lg:flex items-center gap-4 select-none mr-4 scale-90 origin-right self-center">
             {/* Attacker */}
             <div className="flex flex-col items-center gap-1 group">
                 <div className="relative">
                    <Skull size={32} className="text-ark-text" />
                    <div className="absolute -right-2 top-0 text-[8px] text-ark-danger animate-pulse">!</div>
                 </div>
                 <span className="text-[10px] text-ark-subtext font-mono">{t('vs_diagram_try', lang)}</span>
             </div>
             
             {/* Arrow 1: Attempt Attack */}
             <div className="flex flex-col items-center w-24 relative">
                 <div className="text-[9px] text-ark-danger mb-1 whitespace-nowrap">{t('vs_diagram_attacker', lang)}</div>
                 <div className="w-full h-[1px] bg-ark-danger relative">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-ark-danger" />
                 </div>
             </div>

             {/* Node */}
             <div className="flex flex-col items-center gap-1 border border-ark-primary/50 p-2 rounded-sm bg-ark-bg relative">
                <Server size={20} className="text-ark-primary" />
                <span className="text-[10px] text-ark-subtext font-mono">{t('vs_diagram_node', lang)}</span>
             </div>

             {/* Arrow 2: Attack Data */}
             <div className="flex flex-col items-center w-24 relative">
                 <div className="text-[9px] text-ark-primary mb-1 whitespace-nowrap">{t('vs_diagram_data', lang)}</div>
                 <div className="w-full h-[1px] bg-ark-primary relative">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-ark-primary" />
                 </div>
             </div>

             {/* Engine */}
             <div className="flex flex-col items-center gap-1 border border-ark-primary p-2 rounded-sm bg-ark-bg shadow-[0_0_10px_rgba(35,173,229,0.2)]">
                 <SearchIcon size={24} className="text-ark-primary animate-pulse" />
                 <span className="text-[10px] text-ark-subtext font-mono">{t('vs_diagram_engine', lang)}</span>
             </div>

             {/* Arrow 3: Judgment */}
             <div className="flex flex-col items-center w-24 relative">
                 <div className="text-[9px] text-ark-text mb-1 whitespace-nowrap">{t('vs_diagram_judge', lang)}</div>
                 <div className="w-full h-[1px] bg-ark-subtext relative">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-ark-subtext" />
                 </div>
             </div>

             {/* Result */}
             <div className="flex flex-col items-center gap-1 p-2 rounded-sm bg-ark-panel border border-ark-border">
                 <div className="flex gap-1">
                     <span className="bg-red-500 text-white text-[8px] px-1 rounded-sm">SQL</span>
                     <span className="bg-yellow-500 text-black text-[8px] px-1 rounded-sm">CMD</span>
                     <span className="bg-ark-subtext text-white text-[8px] px-1 rounded-sm">...</span>
                 </div>
                 <span className="text-[10px] text-ark-subtext font-mono">{t('vs_diagram_result', lang)}</span>
                 <div className="absolute bottom-0 text-[9px] text-ark-subtext/50">PRTS Mgt</div>
             </div>
        </div>
    );
}

// Custom Toggle Switch
const ToggleSwitch: React.FC<{ checked: boolean, onChange: () => void, loading?: boolean }> = ({ checked, onChange, loading }) => (
    <div 
        onClick={() => { if (!loading) onChange(); }}
        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300 ${checked ? 'bg-ark-primary' : 'bg-ark-subtext/30'} ${loading ? 'opacity-50 cursor-wait' : ''}`}
    >
        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-5' : 'translate-x-0'} ${loading ? 'animate-pulse' : ''}`} />
    </div>
);

export const VulnSimulation: React.FC = () => {
    const { lang, authFetch } = useApp();
    const { notify } = useNotification();
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(true);    const [pendingRules, setPendingRules] = useState<Set<string>>(new Set());
    const fetchRules = async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/v1/vuln-rules');
            if (response.ok) {
                const data = await response.json();
                setRules(data);
            }
        } catch (error) {
            console.error("Failed to fetch vuln rules", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, [authFetch]);

    const toggleRuleStatus = async (id: string) => {
        const rule = rules.find(r => r.id === id);
        if (!rule || pendingRules.has(id)) return;
        
        const newStatus = rule.status === 'active' ? 'inactive' : 'active';
        setPendingRules(prev => new Set(prev).add(id));
        try {
            const response = await authFetch(`/api/v1/vuln-rules/${id}`, {
                method: 'POST',
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setRules(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
                notify('info', t('op_success', lang), t('op_rule_updated', lang));
            } else {
                notify('error', t('op_failed', lang), 'Failed to update rule status');
            }
        } catch (error) {
            notify('error', t('op_failed', lang), t('err_network', lang));
        } finally {
            setPendingRules(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (pendingRules.has(id)) return;
        setPendingRules(prev => new Set(prev).add(id));
        try {
            const response = await authFetch(`/api/v1/vuln-rules/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setRules(prev => prev.filter(r => r.id !== id));
                notify('error', t('op_success', lang), t('op_item_deleted', lang));
            } else {
                notify('error', t('op_failed', lang), 'Failed to delete rule');
            }
        } catch (error) {
            notify('error', t('op_failed', lang), t('err_network', lang));
        } finally {
            setPendingRules(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleToggle = () => {
        const newState = !enabled;
        setEnabled(newState);
        notify(newState ? 'success' : 'warning', t('op_success', lang), newState ? t('msg_module_on', lang) : t('msg_module_off', lang));
    };

    const getSeverityBadge = (sev: string) => {
        const baseClass = "flex items-center gap-1 px-2 py-0.5 text-[10px] border rounded-sm w-fit font-bold uppercase";
        switch (sev) {
            case 'high': return <span className={`${baseClass} border-red-500/50 text-red-500 bg-red-500/10`}><ShieldAlert size={10} /> {t('vs_level_high', lang)}</span>;
            case 'medium': return <span className={`${baseClass} border-yellow-500/50 text-yellow-500 bg-yellow-500/10`}><AlertTriangle size={10} /> {t('vs_level_medium', lang)}</span>;
            case 'low': return <span className={`${baseClass} border-blue-500/50 text-blue-500 bg-blue-500/10`}><Activity size={10} /> {t('vs_level_low', lang)}</span>;
            case 'suspicious': return <span className={`${baseClass} border-orange-500/50 text-orange-500 bg-orange-500/10`}><AlertTriangle size={10} /> {t('vs_level_suspicious', lang)}</span>;
            default: return <span className={`${baseClass} border-gray-500/50 text-gray-500 bg-gray-500/10`}>{t('vs_level_other', lang)}</span>;
        }
    };

    return (
        <div className="flex flex-col gap-4 pb-6 min-h-full">
            {/* Header */}
            <div className="bg-ark-panel border border-ark-border shadow-sm relative transition-all duration-300">
                 {/* Accent Line with Animation */}
                 <div className={`absolute top-0 left-0 h-full bg-ark-primary transition-all duration-300 ease-out ${enabled ? 'w-1 opacity-100' : 'w-0 opacity-0'}`} />
                 
                 <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                     <div className="flex-1 w-full max-w-4xl relative z-10">
                         <div className="flex items-center gap-4 mb-4 flex-wrap">
                             <div className="p-2 bg-ark-active/20 rounded-sm text-ark-primary border border-ark-primary/20 shrink-0">
                                 <Activity size={20} className="md:w-6 md:h-6" />
                             </div>
                             <h2 className="text-lg md:text-xl font-bold text-ark-text">{t('vs_title', lang)}</h2>
                             {/* Toggle Switch */}
                             <button 
                                onClick={handleToggle}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 cursor-pointer ml-2 ${enabled ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
                                aria-label="Toggle Simulation"
                             >
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                             </button>
                         </div>
                         <div className="text-xs text-ark-text/80 font-mono leading-relaxed space-y-2 w-full">
                            <p className="break-words whitespace-normal">{t('vs_desc', lang)}</p>
                         </div>
                     </div>

                     {/* Visual Flow */}
                     <FlowDiagram lang={lang} />
                 </div>
            </div>

            {/* Filter Section */}
            <div className="bg-ark-panel border border-ark-border p-4 shadow-sm space-y-4">
                 {/* Row 1: Inputs */}
                 <div className="flex flex-col md:flex-row gap-3">
                     <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                         <FilterInput label={t('vs_filter_name', lang)} placeholder={t('filter_placeholder_search', lang)} />
                         <FilterInput label={t('vs_filter_type', lang)}>
                             <FilterSelect options={[t('filter_all', lang), 'Behavior - Internal', 'Simulation & Detection']} />
                         </FilterInput>
                         <FilterInput label={t('vs_filter_status', lang)}>
                             <FilterSelect options={[t('filter_all', lang), 'Active', 'Inactive']} />
                         </FilterInput>
                     </div>
                 </div>

                 {/* Row 2: Segmented Controls */}
                 <div className="flex flex-col md:flex-row gap-6 border-t border-ark-border/50 pt-4 items-start md:items-center justify-between">
                     <div className="flex flex-col md:flex-row gap-6 items-start md:items-center w-full md:w-auto">
                         <div className="flex items-center gap-4 overflow-x-auto w-full md:w-auto">
                             <span className="text-xs font-mono text-ark-subtext font-bold whitespace-nowrap shrink-0">{t('vs_filter_level', lang)}:</span>
                             <div className="flex gap-2">
                                 {[t('vs_level_all', lang), t('vs_level_high', lang), t('vs_level_medium', lang), t('vs_level_low', lang), t('vs_level_suspicious', lang), t('vs_level_other', lang)].map((level, i) => (
                                     <button key={i} className={`text-xs px-2 py-1 transition-colors whitespace-nowrap ${i === 0 ? 'text-ark-text font-bold border-b-2 border-ark-text' : 'text-ark-subtext hover:text-ark-primary'}`}>
                                         {level}
                                     </button>
                                 ))}
                             </div>
                         </div>
                         
                         <div className="h-4 w-[1px] bg-ark-border hidden md:block" />

                         <div className="flex items-center gap-4 w-full md:w-auto">
                             <span className="text-xs font-mono text-ark-subtext font-bold whitespace-nowrap shrink-0">{t('vs_filter_hit', lang)}:</span>
                             <div className="flex gap-1 bg-ark-bg p-1 rounded-sm border border-ark-border">
                                 {[t('vs_hit_all', lang), t('vs_hit_yes', lang) + '(26)', t('vs_hit_no', lang)].map((hit, i) => (
                                      <button key={i} className={`px-3 py-1 text-xs rounded-sm whitespace-nowrap ${i === 1 ? 'bg-white text-black shadow-sm font-bold' : 'text-ark-subtext hover:text-ark-text'}`}>
                                          {hit}
                                      </button>
                                 ))}
                             </div>
                         </div>
                     </div>

                     <div className="flex gap-2 self-end md:self-auto mt-4 md:mt-0">
                         <ArkButton variant="primary" size="sm" className="bg-ark-text text-ark-bg hover:bg-ark-primary hover:text-white whitespace-nowrap">
                             {t('vs_btn_new', lang)}
                         </ArkButton>
                         <ArkButton variant="ghost" className="h-[32px] px-3 whitespace-nowrap">
                             {t('filter_reset', lang)}
                         </ArkButton>
                     </div>
                 </div>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col min-h-[500px] bg-ark-panel border border-ark-border overflow-hidden shadow-sm relative">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <ArkLoading />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto custom-scrollbar flex-1">
                            <table className="w-full text-left text-sm min-w-[1400px]">
                                <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase shadow-sm border-b border-ark-border sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="p-4 whitespace-nowrap">{t('vs_col_name', lang)}</th>
                                        <th className="p-4 whitespace-nowrap">{t('vs_col_type', lang)}</th>
                                        <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none">{t('vs_col_severity', lang)} ↕</th>
                                        <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none">{t('vs_col_hit', lang)} ↕</th>
                                        <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none">{t('vs_col_time', lang)} ↕</th>
                                        <th className="p-4 whitespace-nowrap">{t('vs_col_creator', lang)}</th>
                                        <th className="p-4 whitespace-nowrap">{t('vs_col_status', lang)}</th>
                                        <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none">{t('vs_col_mod_time', lang)} ↕</th>
                                        <th className="p-4 whitespace-nowrap">{t('vs_col_mod_by', lang)}</th>
                                        <th className="p-4 whitespace-nowrap text-center">{t('vs_col_op', lang)}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ark-border font-mono text-xs">
                                    {rules.length > 0 ? (
                                        rules.map((rule) => (
                                            <tr key={rule.id} className="hover:bg-ark-active/5 transition-colors group">
                                                <td className="p-4 font-bold text-ark-text">{rule.name}</td>
                                                <td className="p-4 text-ark-subtext">{rule.type}</td>
                                                <td className="p-4">{getSeverityBadge(rule.severity)}</td>
                                                <td className="p-4">
                                                    <span className={`font-bold ${rule.hitCount > 0 ? 'text-ark-primary underline cursor-pointer' : 'text-ark-subtext'}`}>
                                                        {rule.hitCount}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-ark-subtext">{rule.lastHitTime}</td>
                                                <td className="p-4 text-ark-text">{rule.creator}</td>
                                                <td className="p-4">
                                                    <ToggleSwitch 
                                                        checked={rule.status === 'active'} 
                                                        onChange={() => toggleRuleStatus(rule.id)} 
                                                        loading={pendingRules.has(rule.id)}
                                                    />
                                                </td>
                                                <td className="p-4 text-ark-subtext">{rule.updateTime}</td>
                                                <td className="p-4 text-ark-text">{rule.updater}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button className="text-ark-subtext hover:text-ark-primary transition-colors" title={t('btn_edit', lang)}>
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(rule.id)} 
                                                            className={`text-ark-subtext hover:text-ark-danger transition-colors ${pendingRules.has(rule.id) ? 'opacity-50 cursor-wait' : ''}`} 
                                                            title={t('mc_delete', lang)}
                                                            disabled={pendingRules.has(rule.id)}
                                                        >
                                                            {pendingRules.has(rule.id) ? (
                                                                <RefreshCw size={16} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="p-20 text-center">
                                                <div className="flex flex-col items-center justify-center opacity-50 gap-4">
                                                    <div className="w-16 h-16 border-2 border-dashed border-ark-subtext rounded-full flex items-center justify-center bg-ark-active/5">
                                                        <Activity size={32} className="text-ark-subtext" />
                                                    </div>
                                                    <span className="text-ark-subtext font-mono tracking-widest text-xs">{t('no_data', lang)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Pagination */}
                        <div className="p-3 border-t border-ark-border bg-ark-bg flex justify-end items-center gap-4 text-xs font-mono text-ark-subtext">
                            <span>{t('total_records', lang)} {rules.length}</span>
                            <div className="flex gap-1">
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors disabled:opacity-50" disabled><ChevronLeft size={12} /></button>
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-primary bg-ark-primary text-black font-bold">1</button>
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors">2</button>
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors">3</button>
                                <span className="mx-1">...</span>
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors">8</button>
                                <button className="w-6 h-6 flex items-center justify-center border border-ark-border hover:border-ark-primary hover:text-ark-primary transition-colors"><ChevronRight size={12} /></button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
