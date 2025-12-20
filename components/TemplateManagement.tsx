import React, { useState, useEffect } from 'react';
import { ArkButton, ArkLoading } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { X, ChevronLeft, ChevronRight, Layers, Trash2, Plus } from 'lucide-react';
import { HoneypotTemplate } from '../types';

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

export const TemplateManagement: React.FC = () => {
    const { lang, authFetch } = useApp();
    const [templates, setTemplates] = useState<HoneypotTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await authFetch('/api/v1/templates');
                if (res.ok) {
                    const data = await res.json();
                    // Map backend model to frontend interface if needed
                    const mapped = data.map((item: any) => ({
                        id: item.id.toString(),
                        name: item.name,
                        refCount: item.ref_count || 0,
                        ports: item.ports ? item.ports.split(',') : [],
                        description: item.description
                    }));
                    setTemplates(mapped);
                }
            } catch (e) {
                console.error("Failed to fetch templates", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, [authFetch]);

    return (
        <div className="flex flex-col gap-4 pb-6 min-h-full">
            {/* Filter Section */}
            <div className="bg-ark-panel border border-ark-border p-4 shadow-sm space-y-4">
                 <div className="flex flex-col xl:flex-row gap-3">
                     <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                         <FilterInput label={t('tm_filter_name', lang)} placeholder={t('filter_placeholder_search', lang)} />
                         <FilterInput label={t('tm_filter_service', lang)}>
                             <FilterSelect options={[t('filter_all', lang)]} />
                         </FilterInput>
                         <FilterInput label={t('tm_filter_port', lang)}>
                             <FilterSelect options={[t('filter_all', lang)]} />
                         </FilterInput>
                     </div>
                     <div className="flex gap-2 justify-between xl:justify-start">
                         <ArkButton variant="ghost" className="h-[32px] px-4 whitespace-nowrap">
                            <X size={14} className="mr-1" /> {t('filter_reset', lang)}
                         </ArkButton>
                         
                         <div className="flex-1 xl:flex-none flex justify-end">
                            <ArkButton variant="primary" size="sm" className="bg-ark-text text-ark-bg hover:bg-ark-primary hover:text-white whitespace-nowrap">
                                <Plus size={14} className="mr-1" /> {t('tm_btn_new', lang)}
                            </ArkButton>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col min-h-[500px] bg-ark-panel border border-ark-border overflow-hidden shadow-sm relative">
                {loading && <ArkLoading label="FETCHING_TEMPLATES" />}
                
                {!loading && (
                    <div className="overflow-x-auto custom-scrollbar flex-1">
                        <table className="w-full text-left text-sm min-w-[1200px]">
                            <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase shadow-sm border-b border-ark-border sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 whitespace-nowrap w-[25%]">{t('tm_col_name', lang)}</th>
                                    <th className="p-4 whitespace-nowrap cursor-pointer hover:text-ark-primary select-none w-[10%]">{t('tm_col_ref', lang)} ↕</th>
                                    <th className="p-4 whitespace-nowrap w-[30%]">{t('tm_col_ports', lang)}</th>
                                    <th className="p-4 whitespace-nowrap w-[25%]">{t('tm_col_desc', lang)}</th>
                                    <th className="p-4 whitespace-nowrap text-center w-[10%]">{t('tm_col_op', lang)}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ark-border font-mono text-xs">
                                {templates.map((template) => (
                                    <tr key={template.id} className="hover:bg-ark-active/5 transition-colors group">
                                        <td className="p-4 text-ark-text font-bold">{template.name}</td>
                                        <td className="p-4 text-ark-text">
                                            {template.refCount} 个
                                        </td>
                                        <td className="p-4 text-ark-subtext leading-relaxed">
                                            {template.ports.join(', ')}
                                        </td>
                                        <td className="p-4 text-ark-subtext">
                                            <p className="line-clamp-2" title={template.description}>
                                                {template.description}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-4">
                                                <button className="text-red-500/80 hover:text-red-500 transition-colors font-bold" title={t('tm_op_expand', lang)}>
                                                    {t('tm_op_expand', lang)}
                                                </button>
                                                <button className="text-red-500/80 hover:text-red-500 transition-colors font-bold" title={t('tm_op_delete', lang)}>
                                                    {t('tm_op_delete', lang)}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="p-4 border-t border-ark-border bg-ark-bg/30 flex items-center justify-between">
                    <div className="text-xs text-ark-subtext font-mono">
                        TOTAL: <span className="text-ark-text font-bold">{templates.length}</span> TEMPLATES
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-1 border border-ark-border hover:bg-ark-active/10 text-ark-subtext disabled:opacity-30" disabled>
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-3 py-1 bg-ark-active/20 border border-ark-primary/50 text-ark-primary text-xs font-bold">1</div>
                        <button className="p-1 border border-ark-border hover:bg-ark-active/10 text-ark-subtext disabled:opacity-30" disabled>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};