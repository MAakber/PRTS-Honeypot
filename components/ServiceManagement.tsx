import React, { useState, useEffect } from 'react';
import { ArkButton, ArkLoading } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { X, ChevronLeft, ChevronRight, HelpCircle, FileEdit, Cloud, RefreshCw, Trash2 } from 'lucide-react';
import { HoneypotService } from '../types';
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

export const ServiceManagement: React.FC = () => {
    const { lang, authFetch } = useApp();
    const { notify } = useNotification();
    const [services, setServices] = useState<HoneypotService[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/v1/services');
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map((item: any) => ({
                    id: item.id.toString(),
                    name: item.name,
                    category: item.category,
                    interactionType: item.interaction_type,
                    refTemplateCount: item.ref_template_count || 0,
                    refNodeCount: item.ref_node_count || 0,
                    defaultPort: item.default_port,
                    description: item.description,
                    isCloud: item.is_cloud
                }));
                setServices(mapped);
            }
        } catch (e) {
            console.error("Failed to fetch services", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [authFetch]);

    const handleDelete = async (id: string) => {
        setPendingDeletes(prev => new Set(prev).add(id));
        try {
            const res = await authFetch(`/api/v1/services/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setServices(prev => prev.filter(s => s.id !== id));
                notify('success', t('op_success', lang), 'Service deleted successfully');
            } else {
                notify('error', t('op_failed', lang), 'Failed to delete service');
            }
        } catch (e) {
            notify('error', t('op_failed', lang), 'Network error');
        } finally {
            setPendingDeletes(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    return (
        <div className="flex flex-col gap-4 pb-6 min-h-full">
            {/* Filter Section */}
            <div className="bg-ark-panel border border-ark-border p-4 shadow-sm space-y-4">
                 {/* Row 1: Inputs */}
                 <div className="flex flex-col xl:flex-row gap-3">
                     <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                         <FilterInput label={t('sm_filter_name', lang)} placeholder={t('filter_placeholder_search', lang)} />
                         <FilterInput label={t('sm_filter_type', lang)}>
                             <FilterSelect options={[t('filter_all', lang)]} />
                         </FilterInput>
                         <FilterInput label={t('sm_filter_port', lang)}>
                             <FilterSelect options={[t('filter_all', lang)]} />
                         </FilterInput>
                     </div>
                     <div className="flex gap-2 justify-between xl:justify-start">
                         <ArkButton 
                            variant="ghost" 
                            className="h-[32px] px-4 whitespace-nowrap"
                            onClick={fetchServices}
                            disabled={loading}
                         >
                            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> {t('refresh', lang)}
                         </ArkButton>
                         
                         <div className="flex-1 xl:flex-none flex justify-end">
                            <ArkButton variant="primary" size="sm" className="bg-ark-text text-ark-bg hover:bg-ark-primary hover:text-white whitespace-nowrap">
                                {t('sm_btn_new', lang)}
                            </ArkButton>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col min-h-[500px] bg-ark-panel border border-ark-border overflow-hidden shadow-sm relative">
                {loading && <ArkLoading label="FETCHING_SERVICES" />}
                
                <div className="overflow-x-auto custom-scrollbar flex-1">
                     <table className="w-full text-left text-sm min-w-[1400px]">
                         <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase shadow-sm border-b border-ark-border sticky top-0 z-10 backdrop-blur-md">
                             <tr>
                                 <th className="p-4 whitespace-nowrap w-[15%]">{t('sm_col_name', lang)}</th>
                                 <th className="p-4 whitespace-nowrap w-[12%]">{t('sm_col_category', lang)}</th>
                                 <th className="p-4 whitespace-nowrap w-[10%]">{t('sm_col_interaction', lang)}</th>
                                 <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none w-[10%]">{t('sm_col_ref_temp', lang)} ↕</th>
                                 <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none w-[10%]">{t('sm_col_ref_node', lang)} ↕</th>
                                 <th className="p-4 whitespace-nowrap w-[18%] flex items-center gap-1">
                                     {t('sm_col_port', lang)} 
                                     <HelpCircle size={12} className="text-ark-subtext cursor-help" />
                                 </th>
                                 <th className="p-4 whitespace-nowrap w-[20%]">{t('sm_col_desc', lang)}</th>
                                 <th className="p-4 whitespace-nowrap text-center w-[5%]">{t('sm_col_op', lang)}</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-ark-border font-mono text-xs">
                             {services.map((service) => (
                                 <tr key={service.id} className="hover:bg-ark-active/5 transition-colors group">
                                     <td className="p-4">
                                         <div className="flex items-center gap-2">
                                             {service.isCloud && <Cloud size={14} className="text-ark-primary" />}
                                             <span className="text-ark-text font-bold">{service.name}</span>
                                         </div>
                                     </td>
                                     <td className="p-4 text-ark-text">{service.category}</td>
                                     <td className="p-4 text-ark-subtext">
                                         {service.interactionType === 'high' ? t('sm_high_interaction', lang) : t('sm_low_interaction', lang)}
                                     </td>
                                     <td className="p-4 text-ark-text">
                                         {service.refTemplateCount} 个
                                     </td>
                                     <td className="p-4 text-ark-text">
                                         {service.refNodeCount} 个
                                     </td>
                                     <td className="p-4 text-ark-subtext break-all">
                                         {service.defaultPort}
                                     </td>
                                     <td className="p-4 text-ark-subtext relative group/desc">
                                         <div className="flex items-start gap-1">
                                             <p className="line-clamp-2 leading-relaxed" title={service.description}>
                                                 {service.description}
                                             </p>
                                             <HelpCircle size={12} className="text-ark-subtext opacity-50 shrink-0 mt-0.5 cursor-help" />
                                         </div>
                                     </td>
                                     <td className="p-4 text-center">
                                         <div className="flex items-center justify-center gap-3">
                                             <button className="text-ark-subtext hover:text-ark-primary transition-colors" title="Edit">
                                                 <FileEdit size={14} />
                                             </button>
                                             <button 
                                                className={`text-ark-subtext hover:text-red-500 transition-colors ${pendingDeletes.has(service.id) ? 'opacity-50 cursor-wait' : ''}`} 
                                                title="Delete"
                                                onClick={() => handleDelete(service.id)}
                                                disabled={pendingDeletes.has(service.id)}
                                             >
                                                 {pendingDeletes.has(service.id) ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                             </button>
                                         </div>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                </div>

                {/* Footer Pagination */}
                <div className="p-3 border-t border-ark-border bg-ark-bg flex justify-end items-center gap-4 text-xs font-mono text-ark-subtext">
                    <span>{t('total_records', lang)} {services.length}</span>
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