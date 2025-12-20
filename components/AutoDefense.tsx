
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArkPageHeader, ArkButton, ArkInput } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
// Fixed: Added ChevronRight to the import list
import { ShieldCheck, Zap, ArrowRight, Settings, Plus, Edit, Trash2, X, Save, ChevronRight, Clock, AlertTriangle, Hash, Shield } from 'lucide-react';
import { DefenseStrategy } from '../types';
import { useNotification } from './NotificationSystem';
import { authFetch } from '../services/aiService';

const ToggleSwitch: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => (
    <div
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300 ${checked ? 'bg-ark-primary' : 'bg-ark-subtext/30'}`}
    >
        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
);

// Helper types for structured form
type TriggerType = 'ssh_fail' | 'web_admin' | 'syn_flood' | 'port_scan';
type ActionType = 'block_ip' | 'drop_packet' | 'alert';
type DurationType = '1h' | '24h' | '7d' | 'perm';

export const AutoDefense: React.FC = () => {
    const { lang } = useApp();
    const { notify } = useNotification();
    const [strategies, setStrategies] = useState<DefenseStrategy[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false); // 控制DOM是否挂载
    const [isClosing, setIsClosing] = useState(false); // 控制退出动画
    const [editingStrategy, setEditingStrategy] = useState<DefenseStrategy | null>(null);

    useEffect(() => {
        fetchStrategies();
    }, []);

    const fetchStrategies = async () => {
        try {
            const data = await authFetch('/api/v1/defense-strategies');
            if (data) setStrategies(data);
        } catch (error) {
            console.error('Failed to fetch defense strategies:', error);
        } finally {
            setLoading(false);
        }
    };

    // Structured Form State
    const [formName, setFormName] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [triggerType, setTriggerType] = useState<TriggerType>('ssh_fail');
    const [triggerValue, setTriggerValue] = useState<number>(5);
    const [actionType, setActionType] = useState<ActionType>('block_ip');
    const [actionDuration, setActionDuration] = useState<DurationType>('24h');

    // Parse existing string strategy into structured state
    const parseStrategy = (strategy: DefenseStrategy) => {
        setFormName(strategy.name);
        setFormDesc(strategy.description);

        // Simple heuristic parsing for mock data
        if (strategy.trigger.includes('SSH')) {
            setTriggerType('ssh_fail');
            const match = strategy.trigger.match(/>\s*(\d+)/);
            setTriggerValue(match ? parseInt(match[1]) : 5);
        } else if (strategy.trigger.includes('admin')) {
            setTriggerType('web_admin');
            setTriggerValue(1);
        } else if (strategy.trigger.includes('SYN')) {
            setTriggerType('syn_flood');
            const match = strategy.trigger.match(/>\s*(\d+)/);
            setTriggerValue(match ? parseInt(match[1]) : 1000);
        } else {
            setTriggerType('port_scan');
            setTriggerValue(10);
        }

        if (strategy.action.includes('Block')) {
            setActionType('block_ip');
            if (strategy.action.includes('Perm')) setActionDuration('perm');
            else if (strategy.action.includes('24h')) setActionDuration('24h');
            else setActionDuration('1h');
        } else if (strategy.action.includes('Drop')) {
            setActionType('drop_packet');
        } else {
            setActionType('alert');
        }
    };

    // Format structured state back to string
    const formatStrategy = () => {
        let triggerStr = '';
        switch (triggerType) {
            case 'ssh_fail': triggerStr = `SSH Login Fail > ${triggerValue}`; break;
            case 'web_admin': triggerStr = `Access /admin_backup`; break;
            case 'syn_flood': triggerStr = `SYN > ${triggerValue}/s`; break;
            case 'port_scan': triggerStr = `Port Scan > ${triggerValue}`; break;
        }

        let actionStr = '';
        switch (actionType) {
            case 'block_ip':
                const durMap = { '1h': '1h', '24h': '24h', '7d': '7d', 'perm': 'Perm' };
                actionStr = `Block IP (${durMap[actionDuration]})`;
                break;
            case 'drop_packet': actionStr = `Drop Packet`; break;
            case 'alert': actionStr = `Alert Only`; break;
        }

        return { trigger: triggerStr, action: actionStr };
    };

    const toggleStrategy = (id: string) => {
        setStrategies(prev => prev.map(s => {
            if (s.id === id) {
                const newStatus = s.status === 'active' ? 'inactive' : 'active';
                const statusLabel = newStatus === 'active' ? t('status_active_state', lang) : t('status_inactive_state', lang);
                notify(newStatus === 'active' ? 'success' : 'warning', t('op_success', lang), `${s.name}: ${statusLabel}`);
                return { ...s, status: newStatus as 'active' | 'inactive' };
            }
            return s;
        }));
    };

    const handleOpenModal = (strategy?: DefenseStrategy) => {
        if (strategy) {
            setEditingStrategy(strategy);
            parseStrategy(strategy);
        } else {
            setEditingStrategy(null);
            setFormName('');
            setFormDesc('');
            setTriggerType('ssh_fail');
            setTriggerValue(5);
            setActionType('block_ip');
            setActionDuration('24h');
        }
        setIsModalVisible(true);
        setIsClosing(false);
    };

    const handleCloseModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsModalVisible(false);
            setIsClosing(false);
        }, 200);
    };

    const handleSave = () => {
        if (!formName) {
            notify('error', t('op_failed', lang), lang === 'zh' ? "请填写策略名称。" : "Please enter a strategy name.");
            return;
        }

        const { trigger, action } = formatStrategy();

        if (editingStrategy) {
            setStrategies(prev => prev.map(s => s.id === editingStrategy.id ? {
                ...s,
                name: formName,
                description: formDesc,
                trigger,
                action
            } : s));
            notify('success', t('op_success', lang), t('op_strategy_updated', lang));
        } else {
            const newStrategy: DefenseStrategy = {
                id: `S-00${strategies.length + 1}`,
                name: formName,
                description: formDesc,
                trigger,
                action,
                status: 'active',
                hitCount: 0
            };
            setStrategies([...strategies, newStrategy]);
            notify('success', t('op_success', lang), t('op_strategy_added', lang));
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        setStrategies(prev => prev.filter(s => s.id !== id));
        notify('error', t('op_success', lang), t('op_strategy_deleted', lang));
    };

    return (
        <>
            <div className="flex flex-col h-full bg-ark-bg border border-ark-border overflow-hidden">
                <ArkPageHeader
                    icon={<Zap size={24} />}
                    title={t('ad_auto_title', lang)}
                    subtitle={t('ad_subtitle', lang)}
                    extra={
                        <ArkButton size="sm" onClick={() => handleOpenModal()}>
                            <Plus size={14} className="mr-2" /> {t('ad_btn_add', lang)}
                        </ArkButton>
                    }
                />

                <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ark-primary"></div>
                        </div>
                    ) : strategies.length > 0 ? (
                        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {strategies.map(strategy => (
                                <div
                                    key={strategy.id}
                                    className={`
                                    relative bg-ark-panel border transition-all duration-300 flex flex-col group
                                    ${strategy.status === 'active' ? 'border-ark-primary shadow-[0_0_15px_rgba(35,173,229,0.1)]' : 'border-ark-border opacity-80'}
                                `}
                                >
                                    <div className="p-4 border-b border-ark-border bg-ark-bg/30 flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-ark-text">{strategy.name}</h4>
                                            <p className="text-[10px] text-ark-subtext font-mono mt-1">{strategy.id}</p>
                                        </div>
                                        <ToggleSwitch checked={strategy.status === 'active'} onChange={() => toggleStrategy(strategy.id)} />
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col gap-4">
                                        <p className="text-xs text-ark-subtext h-10 line-clamp-2">{strategy.description}</p>
                                        <div className="bg-ark-active/5 p-3 rounded-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-2">
                                            <div className="flex-1 text-center min-w-0">
                                                <span className="block text-[9px] text-ark-subtext uppercase tracking-wider mb-1">{t('ad_trigger', lang)}</span>
                                                <span className="text-xs font-bold text-ark-text block truncate" title={strategy.trigger}>{strategy.trigger}</span>
                                            </div>
                                            <ArrowRight size={14} className="text-ark-subtext shrink-0" />
                                            <div className="flex-1 text-center min-w-0">
                                                <span className="block text-[9px] text-ark-subtext uppercase tracking-wider mb-1">{t('ad_action', lang)}</span>
                                                <span className="text-xs font-bold text-ark-primary block truncate" title={strategy.action}>{strategy.action}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 border-t border-ark-border bg-ark-bg/20 flex justify-between items-center text-xs font-mono">
                                        <span className="text-ark-subtext">{t('tf_hits', lang)}: <span className="text-ark-text font-bold">{strategy.hitCount}</span></span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleOpenModal(strategy)} className="p-1.5 hover:bg-ark-active/20 rounded-sm text-ark-subtext hover:text-ark-primary transition-colors"><Edit size={14} /></button>
                                            <button onClick={() => handleDelete(strategy.id)} className="p-1.5 hover:bg-ark-danger/20 rounded-sm text-ark-subtext hover:text-ark-danger transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-ark-subtext opacity-50 gap-6 min-h-[400px]">
                            <div className="w-24 h-24 border-2 border-dashed border-ark-subtext rounded-full flex items-center justify-center bg-ark-active/5">
                                <Shield size={48} className="text-ark-subtext" />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="font-mono text-xl tracking-widest font-bold text-ark-text">{t('no_data', lang)}</span>
                                <span className="text-xs font-mono opacity-70 tracking-wider">SYSTEM.DEFENSE.STRATEGY.EMPTY</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Portal with Animations */}
                {isModalVisible && createPortal(
                    <>
                        <div className={"fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 " + (isClosing ? 'opacity-0' : 'opacity-100')}>
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} />

                            {/* Modal Box */}
                            <div className={"w-full max-w-lg bg-ark-panel border border-[#23ade5] shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative flex flex-col " + (isClosing ? 'animate-ark-modal-out' : 'animate-ark-modal-in')}>
                                {/* Arknights Style Corners */}
                                <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#23ade5]" />
                                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#23ade5]" />

                                {/* Header */}
                                <div className="flex justify-between items-center p-4 border-b border-ark-border">
                                    <h3 className="text-sm font-bold text-ark-text uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Settings size={18} className="text-[#23ade5]" />
                                        {editingStrategy ? t('ad_modal_title_edit', lang) : t('ad_modal_title_add', lang)}
                                    </h3>
                                    <button onClick={handleCloseModal} className="text-ark-subtext hover:text-ark-text transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-6">

                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-ark-subtext uppercase tracking-widest">{t('ad_form_name', lang)}</label>
                                            <input
                                                className="w-full bg-ark-bg border border-ark-border px-4 py-3 text-sm text-ark-text font-mono outline-none focus:border-[#23ade5] transition-colors"
                                                value={formName}
                                                onChange={e => setFormName(e.target.value)}
                                                placeholder={lang === 'zh' ? "策略名称" : "Strategy Name"}
                                            />
                                        </div>
                                    </div>

                                    {/* Logic Builder: Trigger */}
                                    <div className="p-4 bg-ark-bg/30 border border-ark-border relative">
                                        <div className="absolute -top-2.5 left-3 bg-ark-panel px-2 text-[10px] font-bold text-ark-primary uppercase tracking-widest border border-ark-border">
                                            {t('ad_trigger', lang)}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-ark-subtext uppercase">{t('ad_label_event_type', lang)}</label>
                                                <div className="relative">
                                                    <select
                                                        value={triggerType}
                                                        onChange={e => setTriggerType(e.target.value as TriggerType)}
                                                        className="w-full bg-ark-bg border border-ark-border px-3 py-2 text-sm text-ark-text font-mono outline-none focus:border-[#23ade5] appearance-none"
                                                    >
                                                        <option value="ssh_fail">{t('ad_trigger_ssh', lang)}</option>
                                                        <option value="web_admin">{t('ad_trigger_web', lang)}</option>
                                                        <option value="syn_flood">{t('ad_trigger_syn', lang)}</option>
                                                        <option value="port_scan">{t('ad_trigger_port', lang)}</option>
                                                    </select>
                                                    <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-ark-subtext pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-ark-subtext uppercase">{triggerType !== 'web_admin' ? t('ad_label_threshold', lang) : t('ad_label_threshold_simple', lang)}</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={triggerValue}
                                                        onChange={e => setTriggerValue(parseInt(e.target.value))}
                                                        disabled={triggerType === 'web_admin'}
                                                        className="w-full bg-ark-bg border border-ark-border px-3 py-2 text-sm text-ark-text font-mono outline-none focus:border-[#23ade5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                    <Hash size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ark-subtext pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow Connector */}
                                    <div className="flex justify-center -my-3 relative z-10">
                                        <div className="bg-ark-panel p-1 rounded-full border border-ark-border text-ark-subtext">
                                            <ArrowRight size={16} className="rotate-90" />
                                        </div>
                                    </div>

                                    {/* Logic Builder: Action */}
                                    <div className="p-4 bg-ark-bg/30 border border-ark-border relative">
                                        <div className="absolute -top-2.5 left-3 bg-ark-panel px-2 text-[10px] font-bold text-[#f97316] uppercase tracking-widest border border-ark-border">
                                            {t('ad_action', lang)}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-ark-subtext uppercase">{t('ad_label_action_type', lang)}</label>
                                                <div className="relative">
                                                    <select
                                                        value={actionType}
                                                        onChange={e => setActionType(e.target.value as ActionType)}
                                                        className="w-full bg-ark-bg border border-ark-border px-3 py-2 text-sm text-ark-text font-mono outline-none focus:border-[#f97316] appearance-none"
                                                    >
                                                        <option value="block_ip">{t('ad_action_block', lang)}</option>
                                                        <option value="drop_packet">{t('ad_action_drop', lang)}</option>
                                                        <option value="alert">{t('ad_action_alert', lang)}</option>
                                                    </select>
                                                    <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-ark-subtext pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-ark-subtext uppercase">{t('ad_label_duration', lang)}</label>
                                                <div className="relative">
                                                    <select
                                                        value={actionDuration}
                                                        onChange={e => setActionDuration(e.target.value as DurationType)}
                                                        disabled={actionType !== 'block_ip'}
                                                        className="w-full bg-ark-bg border border-ark-border px-3 py-2 text-sm text-ark-text font-mono outline-none focus:border-[#f97316] appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="1h">{t('ad_duration_1h', lang)}</option>
                                                        <option value="24h">{t('ad_duration_24h', lang)}</option>
                                                        <option value="7d">{t('ad_duration_7d', lang)}</option>
                                                        <option value="perm">{t('ad_duration_perm', lang)}</option>
                                                    </select>
                                                    <Clock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ark-subtext pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-ark-subtext uppercase tracking-widest">{t('ad_form_desc', lang)}</label>
                                        <textarea
                                            className="w-full bg-ark-bg border border-ark-border px-4 py-3 text-sm text-ark-text font-mono outline-none focus:border-[#23ade5] transition-colors resize-none h-20"
                                            placeholder={lang === 'zh' ? "输入协议描述..." : "Description..."}
                                            value={formDesc}
                                            onChange={e => setFormDesc(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t border-ark-border flex items-center justify-between gap-6">
                                    <button onClick={handleCloseModal} className="text-xs font-bold text-ark-text hover:text-[#23ade5] transition-colors px-6 py-2 uppercase tracking-widest">
                                        {t('btn_cancel', lang)}
                                    </button>
                                    <ArkButton variant="primary" className="flex-1 !bg-[#23ade5] !text-black !rounded-none h-11" onClick={handleSave}>
                                        <Save size={16} className="mr-2" /> {t('btn_save', lang)}
                                    </ArkButton>
                                </div>
                            </div>
                        </div>
                    </>,
                    document.body
                )}
            </div>
        </>
    );
};
