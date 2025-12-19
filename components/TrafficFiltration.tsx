
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArkPageHeader, ArkButton, ArkInput } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { Filter, Search, Plus, Trash2, X, Save, Regex, ChevronRight } from 'lucide-react';
import { MOCK_TRAFFIC_RULES } from '../constants';
import { useNotification } from './NotificationSystem';
import { TrafficRule } from '../types';

const ToggleSwitch: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => (
    <div 
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors duration-300 ${checked ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
    >
        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
);

export const TrafficFiltration: React.FC = () => {
    const { lang } = useApp();
    const { notify } = useNotification();
    const [rules, setRules] = useState(MOCK_TRAFFIC_RULES);
    const [activeCategoryKey, setActiveCategoryKey] = useState('tf_cat_all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Form State
    const [formName, setFormName] = useState('');
    const [formCategory, setFormCategory] = useState('Web Attack');
    const [formPattern, setFormPattern] = useState('');

    const toggleRule = (id: string) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r));
    };

    const handleDelete = (id: string) => {
        setRules(prev => prev.filter(r => r.id !== id));
        notify('error', t('op_success', lang), t('op_item_deleted', lang));
    };

    const openAddModal = () => {
        setFormName('');
        setFormCategory('Web Attack');
        setFormPattern('');
        setIsModalOpen(true);
        setIsClosing(false);
    };

    const closeAddModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsClosing(false);
        }, 200);
    };

    const handleSaveRule = () => {
        if (!formName || !formPattern) {
            notify('warning', t('op_failed', lang), lang === 'zh' ? "请填写规则名称和特征" : "Please fill in rule name and pattern");
            return;
        }

        const newRule: TrafficRule = {
            id: `T-${Date.now()}`,
            name: formName,
            category: formCategory,
            pattern: formPattern,
            status: 'active',
            hits: 0
        };

        setRules([newRule, ...rules]);
        notify('success', t('op_success', lang), t('op_rule_added', lang));
        closeAddModal();
    };

    const categories = [
        { key: 'tf_cat_all', value: 'All' },
        { key: 'tf_cat_sqli', value: 'SQL Injection' },
        { key: 'tf_cat_xss', value: 'XSS' },
        { key: 'tf_cat_web', value: 'Web Attack' }
    ];

    const activeCategoryValue = categories.find(c => c.key === activeCategoryKey)?.value || 'All';
    const filteredRules = activeCategoryValue === 'All' ? rules : rules.filter(r => r.category === activeCategoryValue);

    return (
        <div className="flex flex-col h-full bg-ark-bg border border-ark-border overflow-hidden">
            <ArkPageHeader 
                icon={<Filter size={24} />} 
                title={t('ad_filter_title', lang)} 
                subtitle={t('tf_subtitle', lang)}
            />

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Sidebar Categories */}
                <div className="w-full md:w-64 bg-ark-panel border-b md:border-b-0 md:border-r border-ark-border p-4 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0">
                    {categories.map(cat => (
                        <button 
                            key={cat.key}
                            onClick={() => setActiveCategoryKey(cat.key)}
                            className={`text-left px-4 py-3 text-sm font-bold border-l-2 transition-all whitespace-nowrap ${activeCategoryKey === cat.key ? 'bg-ark-active/20 text-ark-primary border-ark-primary' : 'bg-transparent text-ark-subtext border-transparent hover:bg-ark-active/10 hover:text-ark-text'}`}
                        >
                            {t(cat.key as any, lang)}
                        </button>
                    ))}
                </div>

                {/* Main List */}
                <div className="flex-1 bg-ark-bg/30 p-4 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-4 h-full flex flex-col">
                        <div className="flex justify-end mb-4 shrink-0">
                            <ArkButton size="sm" onClick={openAddModal}>
                                <Plus size={14} className="mr-2" /> {t('ac_add_rule', lang)}
                            </ArkButton>
                        </div>

                        {filteredRules.length > 0 ? (
                            filteredRules.map(rule => (
                                <div key={rule.id} className="bg-ark-panel border border-ark-border p-4 flex items-center justify-between hover:border-ark-primary/50 transition-colors shrink-0">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-ark-text">{rule.name}</h4>
                                            <span className="text-[10px] px-2 py-0.5 bg-ark-subtext/10 text-ark-subtext rounded-sm border border-ark-border uppercase">{rule.category}</span>
                                        </div>
                                        <p className="text-xs font-mono text-ark-subtext">{t('tf_label_pattern', lang)} <span className="text-ark-primary">{rule.pattern}</span></p>
                                    </div>
                                    
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <span className="block text-xl font-bold text-ark-text font-mono">{rule.hits}</span>
                                            <span className="text-[10px] text-ark-subtext uppercase">{t('tf_hits', lang)}</span>
                                        </div>
                                        <div className="h-8 w-[1px] bg-ark-border" />
                                        <ToggleSwitch checked={rule.status === 'active'} onChange={() => toggleRule(rule.id)} />
                                        <button onClick={() => handleDelete(rule.id)} className="text-ark-subtext hover:text-ark-danger transition-colors p-2">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-ark-subtext opacity-50 gap-6 min-h-[300px]">
                                <div className="w-24 h-24 border-2 border-dashed border-ark-subtext rounded-full flex items-center justify-center bg-ark-active/5">
                                    <Filter size={48} className="text-ark-subtext" />
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="font-mono text-xl tracking-widest font-bold text-ark-text">{t('ac_empty_rules', lang)}</span>
                                    <span className="text-xs font-mono opacity-70 tracking-wider">SYSTEM.TRAFFIC.RULES.EMPTY</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Rule Modal */}
            {isModalOpen && createPortal(
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeAddModal} />
                    
                    <div className={`
                        w-full max-w-md bg-ark-panel border border-[#23ade5] shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative flex flex-col
                        ${isClosing ? 'animate-ark-modal-out' : 'animate-ark-modal-in'}
                    `}>
                        {/* Corners */}
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#23ade5]" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#23ade5]" />

                        <div className="flex justify-between items-center p-4 border-b border-ark-border">
                            <h3 className="text-sm font-bold text-ark-text uppercase tracking-[0.2em] flex items-center gap-2">
                                <Plus size={18} className="text-[#23ade5]" /> 
                                {t('tf_modal_title_add', lang)}
                            </h3>
                            <button onClick={closeAddModal} className="text-ark-subtext hover:text-ark-text transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-ark-subtext uppercase tracking-widest">{t('tf_form_name', lang)}</label>
                                <ArkInput 
                                    value={formName} 
                                    onChange={e => setFormName(e.target.value)} 
                                    placeholder={t('tf_placeholder_name', lang)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-ark-subtext uppercase tracking-widest">{t('tf_form_category', lang)}</label>
                                <div className="relative">
                                    <select 
                                        value={formCategory}
                                        onChange={e => setFormCategory(e.target.value)}
                                        className="w-full bg-ark-bg border border-ark-border px-3 py-2 text-sm text-ark-text font-mono outline-none focus:border-[#23ade5] appearance-none"
                                    >
                                        <option value="SQL Injection">SQL Injection</option>
                                        <option value="XSS">XSS</option>
                                        <option value="Web Attack">Web Attack</option>
                                        <option value="Bot">Bot</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                    <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-ark-subtext pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-ark-subtext uppercase tracking-widest">{t('tf_form_pattern', lang)}</label>
                                <ArkInput 
                                    value={formPattern} 
                                    onChange={e => setFormPattern(e.target.value)} 
                                    placeholder={t('tf_placeholder_pattern', lang)}
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-ark-border flex justify-end gap-3">
                            <button onClick={closeAddModal} className="px-4 py-2 text-xs font-bold text-ark-subtext hover:text-ark-text transition-colors">
                                {t('btn_cancel', lang)}
                            </button>
                            <ArkButton variant="primary" onClick={handleSaveRule}>
                                <Save size={14} className="mr-2" /> {t('btn_save', lang)}
                            </ArkButton>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
