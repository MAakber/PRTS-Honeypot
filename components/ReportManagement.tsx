
import React, { useState } from 'react';
import { ArkButton } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { FileText, Calendar, X, Inbox, ChevronDown, Plus } from 'lucide-react';
import { Report } from '../types';
import { ArkDateRangePicker } from './ArkDateRangePicker';

export const ReportManagement: React.FC = () => {
    const { lang } = useApp();
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'custom'>('daily');
    const [mockReports, setMockReports] = useState<Report[]>([]); // Start empty to match screenshot
    const [dateRange, setDateRange] = useState({ start: '2025-11-30T00:00', end: '2025-12-06T23:59' });

    return (
        <div className="flex flex-col gap-4 pb-6 min-h-full">
            {/* Description Block */}
            <div className="bg-ark-panel border border-ark-border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3 font-bold text-ark-text">
                    <FileText className="text-ark-primary" size={20} />
                    {t('rm_title', lang)}
                </div>
                <div className="text-xs text-ark-subtext font-mono space-y-1.5 leading-relaxed pl-7">
                    <p>{t('rm_desc_title', lang)}</p>
                    <p>• {t('rm_desc_daily', lang)}</p>
                    <p>• {t('rm_desc_weekly', lang)}</p>
                </div>
            </div>

            {/* Filter & Toolbar */}
            <div className="bg-ark-panel border border-ark-border p-4 shadow-sm relative">
                {/* Row 1: Filters */}
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="flex items-center bg-ark-bg border border-ark-border rounded-sm overflow-hidden h-[32px]">
                            <span className="px-3 text-xs font-mono text-ark-subtext border-r border-ark-border flex items-center h-full bg-ark-active/5 whitespace-nowrap">
                                {t('rm_type_label', lang)}
                            </span>
                            <div className="flex h-full">
                                <button 
                                    onClick={() => setReportType('daily')}
                                    className={`px-4 text-xs h-full transition-colors ${reportType === 'daily' ? 'bg-ark-primary text-black font-bold' : 'text-ark-subtext hover:text-ark-text hover:bg-ark-active/10'}`}
                                >
                                    {t('rm_type_daily', lang)}
                                </button>
                                <div className="w-[1px] h-full bg-ark-border"></div>
                                <button 
                                    onClick={() => setReportType('weekly')}
                                    className={`px-4 text-xs h-full transition-colors ${reportType === 'weekly' ? 'bg-ark-primary text-black font-bold' : 'text-ark-subtext hover:text-ark-text hover:bg-ark-active/10'}`}
                                >
                                    {t('rm_type_weekly', lang)}
                                </button>
                                <div className="w-[1px] h-full bg-ark-border"></div>
                                <button 
                                    onClick={() => setReportType('custom')}
                                    className={`px-4 text-xs h-full transition-colors ${reportType === 'custom' ? 'bg-ark-primary text-black font-bold' : 'text-ark-subtext hover:text-ark-text hover:bg-ark-active/10'}`}
                                >
                                    {t('rm_type_custom', lang)}
                                </button>
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="w-full md:w-auto">
                            <ArkDateRangePicker value={dateRange} onChange={setDateRange} />
                        </div>
                    </div>

                    <ArkButton variant="ghost" className="h-[32px] px-4 whitespace-nowrap self-end xl:self-auto">
                        <X size={14} className="mr-1" /> {t('filter_reset', lang)}
                    </ArkButton>
                </div>

                {/* Row 2: Action Buttons */}
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-ark-border/50">
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-ark-panel border border-ark-border text-xs text-ark-text hover:border-ark-primary hover:text-ark-primary transition-colors">
                        {t('rm_btn_auto', lang)} <ChevronDown size={12} />
                    </button>
                    <ArkButton variant="primary" size="sm" className="bg-ark-text text-ark-bg hover:bg-ark-primary hover:text-white whitespace-nowrap">
                        <Plus size={14} className="mr-1" /> {t('rm_btn_new', lang)}
                    </ArkButton>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col min-h-[500px] bg-ark-panel border border-ark-border overflow-hidden shadow-sm relative">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                     <table className="w-full text-left text-sm min-w-[1200px]">
                         <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase shadow-sm border-b border-ark-border sticky top-0 z-10 backdrop-blur-md">
                             <tr>
                                 <th className="p-4 whitespace-nowrap">{t('rm_col_name', lang)}</th>
                                 <th className="p-4 whitespace-nowrap">{t('rm_col_module', lang)}</th>
                                 <th className="p-4 whitespace-nowrap">{t('rm_col_type', lang)}</th>
                                 <th className="p-4 whitespace-nowrap">{t('rm_col_size', lang)}</th>
                                 <th className="p-4 whitespace-nowrap">{t('rm_col_status', lang)}</th>
                                 <th className="p-4 whitespace-nowrap">{t('rm_col_creator', lang)}</th>
                                 <th className="p-4 whitespace-nowrap">{t('rm_col_time', lang)}</th>
                                 <th className="p-4 whitespace-nowrap text-center">{t('rm_col_op', lang)}</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-ark-border font-mono text-xs">
                             {mockReports.length > 0 ? (
                                 mockReports.map(report => (
                                     <tr key={report.id}>
                                         {/* Report Row Implementation would go here */}
                                     </tr>
                                 ))
                             ) : (
                                 <tr>
                                     <td colSpan={8} className="p-32 text-center">
                                         <div className="flex flex-col items-center justify-center opacity-50 gap-4">
                                             <div className="w-16 h-16 border-2 border-dashed border-ark-subtext rounded-lg flex items-center justify-center bg-ark-active/5">
                                                 <Inbox size={32} className="text-ark-subtext" />
                                             </div>
                                             <span className="text-ark-subtext font-mono tracking-widest text-xs">{t('rm_no_data', lang)}</span>
                                         </div>
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                </div>
            </div>
        </div>
    );
};
