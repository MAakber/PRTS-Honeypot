import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArkPageHeader, ArkButton, ArkInput } from './ArknightsUI';
import { useApp } from '../AppContext';
import { t } from '../i18n';
import { ShieldCheck, Plus, RefreshCw, Trash2, Lock, Unlock, Server, Shield, Monitor, Globe, X, Save, Clock, AlertTriangle, Network } from 'lucide-react';
import { useNotification } from './NotificationSystem';
import { AccessControlRule } from '../types';
import { authFetch } from '../services/aiService';

// 复用自律防御的切换开关组件
const ToggleSwitch: React.FC<{ checked: boolean, onChange: () => void, loading?: boolean }> = ({ checked, onChange, loading }) => (
    <div 
        onClick={(e) => { e.stopPropagation(); if (!loading) onChange(); }}
        className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${loading ? 'bg-ark-subtext/20 cursor-wait' : checked ? 'bg-ark-primary cursor-pointer' : 'bg-ark-subtext/30 cursor-pointer'}`}
    >
        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${loading ? 'animate-pulse opacity-50' : checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
);

export const AccessControl: React.FC = () => {
    const { lang } = useApp();
    const { notify } = useNotification();
    const [rules, setRules] = useState<AccessControlRule[]>([]);
    const [nodes, setNodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'blacklist' | 'whitelist'>('blacklist');
    const [isSyncing, setIsSyncing] = useState(false);
    const isSyncingRef = React.useRef(false);
    const [nodeStates, setNodeStates] = useState<Record<string, boolean>>({});
    const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
    const lastNotifiedStatus = React.useRef<Record<string, string>>({});
    const lastNotifiedError = React.useRef<Record<string, string>>({});
    const lastNotifiedInfo = React.useRef<Record<string, string>>({});

    useEffect(() => {
        fetchData();

        const handleSyncComplete = (e: any) => {
            const updatedNode = e.detail;
            
            const wasSyncing = isSyncingRef.current;

            // Force sync state off immediately
            setIsSyncing(false);
            isSyncingRef.current = false;
            setPendingToggles(prev => {
                const next = new Set(prev);
                next.delete(updatedNode.id);
                return next;
            });

            // Show notification if we were syncing OR if there's an error
            // This ensures errors from toggle switches (which don't set isSyncing) are still shown
            if (wasSyncing || updatedNode.firewallStatus === 'error') {
                if (updatedNode.firewallStatus === 'error') {
                    const errorMsg = updatedNode.firewallError || t('fw_error', lang);
                    notify('error', t('op_failed', lang), `${updatedNode.name}: ${errorMsg}`);
                } else if (wasSyncing) {
                    // Only show success if we were explicitly syncing
                    // Toggle switches have their own optimistic success notification
                    const successMsg = updatedNode.firewallInfo || t('op_fw_sync_success', lang);
                    notify('success', t('op_success', lang), successMsg);
                }
            }
            
            // Update refs to prevent duplicate notifications from the subsequent NODE_UPDATE
            lastNotifiedStatus.current[updatedNode.id] = updatedNode.firewallStatus;
            lastNotifiedError.current[updatedNode.id] = updatedNode.firewallError || '';
            lastNotifiedInfo.current[updatedNode.id] = updatedNode.firewallInfo || '';
        };

        const handleNodeUpdate = (e: any) => {
            const updatedNode = e.detail;
            setNodes(prev => {
                const index = prev.findIndex(n => n.id === updatedNode.id);
                if (index === -1) return [updatedNode, ...prev];
                const newNodes = [...prev];
                newNodes[index] = { ...newNodes[index], ...updatedNode };
                return newNodes;
            });
            
            // Update switch state if firewall status changed
            if (updatedNode.firewallStatus) {
                setNodeStates(prev => ({
                    ...prev,
                    [updatedNode.id]: updatedNode.firewallStatus === 'active'
                }));

                // Clear pending toggle if status matches
                setPendingToggles(prev => {
                    if (prev.has(updatedNode.id)) {
                        const next = new Set(prev);
                        next.delete(updatedNode.id);
                        return next;
                    }
                    return prev;
                });

                const wasSyncing = isSyncingRef.current;
                const hasStatusChanged = lastNotifiedStatus.current[updatedNode.id] !== updatedNode.firewallStatus;
                const hasErrorChanged = updatedNode.firewallError && lastNotifiedError.current[updatedNode.id] !== updatedNode.firewallError;
                const hasInfoChanged = updatedNode.firewallInfo && lastNotifiedInfo.current[updatedNode.id] !== updatedNode.firewallInfo;

                // Determine if this update is likely the result of our sync
                // We assume a sync result will have either an error or a non-empty firewallInfo
                const isLikelySyncResult = updatedNode.firewallStatus === 'error' || !!updatedNode.firewallInfo;

                if (wasSyncing && isLikelySyncResult) {
                    setIsSyncing(false);
                    isSyncingRef.current = false;
                }

                // Notification Logic
                if (updatedNode.firewallStatus === 'error' && (hasStatusChanged || hasErrorChanged || (wasSyncing && isLikelySyncResult))) {
                    const errorMsg = updatedNode.firewallError || t('fw_error', lang);
                    notify('error', t('op_failed', lang), `${updatedNode.name}: ${errorMsg}`);
                } else if (hasInfoChanged && updatedNode.firewallStatus === 'active' && updatedNode.firewallInfo && !wasSyncing) {
                    // Background update (not triggered by manual sync)
                    notify('success', t('op_success', lang), updatedNode.firewallInfo);
                }
                
                lastNotifiedStatus.current[updatedNode.id] = updatedNode.firewallStatus;
                lastNotifiedError.current[updatedNode.id] = updatedNode.firewallError || '';
                lastNotifiedInfo.current[updatedNode.id] = updatedNode.firewallInfo || '';
            }
        };

        window.addEventListener('PRTS_NODE_UPDATE', handleNodeUpdate);
        window.addEventListener('PRTS_NODE_SYNC_COMPLETE', handleSyncComplete);
        return () => {
            window.removeEventListener('PRTS_NODE_UPDATE', handleNodeUpdate);
            window.removeEventListener('PRTS_NODE_SYNC_COMPLETE', handleSyncComplete);
        };
    }, []);

    const fetchData = async () => {
        try {
            const [rulesData, nodesData] = await Promise.all([
                authFetch('/api/v1/access-rules'),
                authFetch('/api/v1/nodes')
            ]);
            
            if (rulesData) setRules(rulesData);
            if (nodesData) {
                setNodes(nodesData);
                setNodeStates(
                    nodesData.reduce((acc: any, node: any) => ({ ...acc, [node.id]: node.firewallStatus === 'active' }), {})
                );
            }
        } catch (error) {
            console.error('Failed to fetch access control data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    
    // Form Fields
    const [formTargetType, setFormTargetType] = useState<'ip' | 'cidr'>('ip');
    const [formIp, setFormIp] = useState('');
    const [formType, setFormType] = useState<'blacklist' | 'whitelist'>('blacklist');
    const [formReason, setFormReason] = useState('');
    const [formDuration, setFormDuration] = useState('permanent');
    
    const filteredRules = rules.filter(r => r.type === activeTab);

    const handleSync = async () => {
        setIsSyncing(true);
        isSyncingRef.current = true;
        try {
            const token = localStorage.getItem('prts_token');
            const response = await fetch('/api/v1/access-rules/sync', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // We don't notify success here because the probe will report back via WebSocket
                // and the PRTS_NODE_UPDATE listener will handle the notification.
                // This avoids "Success" showing up before the probe actually finishes.
            } else {
                notify('error', t('op_failed', lang), 'Sync command failed to issue');
                setIsSyncing(false);
                isSyncingRef.current = false;
            }
        } catch (error) {
            console.error('Failed to sync rules:', error);
            notify('error', t('op_failed', lang), 'Network error');
            setIsSyncing(false);
            isSyncingRef.current = false;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const token = localStorage.getItem('prts_token');
            const response = await fetch(`/api/v1/access-rules/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setRules(prev => prev.filter(r => r.id !== id));
                notify('error', t('op_success', lang), t('op_item_deleted', lang));
            } else {
                notify('error', t('op_failed', lang), 'Failed to delete rule');
            }
        } catch (error) {
            console.error('Failed to delete rule:', error);
            notify('error', t('op_failed', lang), 'Network error');
        }
    };

    const toggleNodeFirewall = async (id: string, name: string) => {
        const newState = !nodeStates[id];
        const command = newState ? 'ENABLE_FIREWALL' : 'DISABLE_FIREWALL';
        
        setPendingToggles(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });

        try {
            const token = localStorage.getItem('prts_token');
            const response = await fetch('/api/v1/nodes/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nodeId: id, command })
            });

            if (response.ok) {
                notify('info', t('op_success', lang), `${name}: ${t('op_command_sent', lang)}`);
            } else {
                setPendingToggles(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
                notify('error', t('op_failed', lang), 'Failed to send command');
            }
        } catch (error) {
            console.error('Failed to toggle firewall:', error);
            setPendingToggles(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            notify('error', t('op_failed', lang), 'Network error');
        }
    };

    // Modal Handlers
    const openAddModal = () => {
        setFormTargetType('ip');
        setFormIp('');
        setFormType(activeTab); // Default to current tab context
        setFormReason('');
        setFormDuration('permanent');
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

    const isValidIp = (ip: string) => {
        const regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return regex.test(ip);
    };

    const isValidCidr = (cidr: string) => {
        const regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|[1-2]?[0-9]|[0-9])$/;
        return regex.test(cidr);
    };

    const handleSaveRule = async () => {
        if (!formIp) {
            notify('warning', t('op_failed', lang), lang === 'zh' ? "请输入目标地址" : "Target address is required");
            return;
        }

        if (formTargetType === 'ip' && !isValidIp(formIp)) {
            notify('warning', t('op_failed', lang), t('val_ip_invalid', lang));
            return;
        }

        if (formTargetType === 'cidr' && !isValidCidr(formIp)) {
            notify('warning', t('op_failed', lang), t('val_cidr_invalid', lang));
            return;
        }

        // Calculate Expiration
        let expireTime: string | null = null;
        if (formDuration !== 'permanent') {
            const now = new Date();
            if (formDuration === '1h') now.setHours(now.getHours() + 1);
            else if (formDuration === '24h') now.setHours(now.getHours() + 24);
            else if (formDuration === '7d') now.setDate(now.getDate() + 7);
            
            // Format: YYYY-MM-DD HH:mm:ss
            expireTime = now.getFullYear() + '/' + 
                         String(now.getMonth() + 1).padStart(2, '0') + '/' + 
                         String(now.getDate()).padStart(2, '0') + ' ' + 
                         String(now.getHours()).padStart(2, '0') + ':' + 
                         String(now.getMinutes()).padStart(2, '0') + ':' + 
                         String(now.getSeconds()).padStart(2, '0');
        }

        const defaultReason = formType === 'blacklist' ? t('ac_default_blacklist', lang) : t('ac_default_whitelist', lang);

        const newRule: Partial<AccessControlRule> = {
            ip: formIp,
            type: formType,
            reason: formReason || defaultReason,
            expireTime: expireTime || t('ac_permanent', lang),
            source: 'PRTS',
            status: 'active'
        };

        try {
            const token = localStorage.getItem('prts_token');
            const response = await fetch('/api/v1/access-rules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newRule)
            });

            if (response.ok) {
                const savedRule = await response.json();
                setRules(prev => [savedRule, ...prev]);
                notify('success', t('op_success', lang), t('ac_add_rule', lang));
                closeAddModal();
            } else {
                notify('error', t('op_failed', lang), 'Failed to save rule');
            }
        } catch (error) {
            console.error('Failed to save rule:', error);
            notify('error', t('op_failed', lang), 'Network error');
        }
    };

    const getOSIcon = (os: string) => {
        switch(os) {
            case 'windows': return <Monitor size={20} className="text-blue-400" />;
            default: return <Server size={20} className="text-ark-primary" />;
        }
    }

    const getFirewallName = (os: string) => {
        switch(os) {
            case 'windows': return t('ac_driver_windows', lang);
            default: return t('ac_driver_iptables', lang);
        }
    }

    return (
        <>
            <div className="flex flex-col h-full bg-ark-bg border border-ark-border overflow-hidden">
                <ArkPageHeader 
                    icon={<ShieldCheck size={24} />} 
                    title={t('ad_access_title', lang)} 
                    subtitle={t('ac_subtitle', lang)}
                />

                <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-6">
                    {/* Top Dashboard: Global & Sync Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-ark-panel border border-ark-border p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-ark-active/20 rounded-full text-ark-primary border border-ark-primary/30">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-ark-text">{t('ac_global_strategy', lang)}</h4>
                                    <p className="text-xs text-green-500 font-mono flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        {t('ac_layer_prts', lang)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold font-mono text-ark-text">{rules.length}</span>
                                <p className="text-xs text-ark-subtext uppercase">{t('ac_stat_active_rules', lang)}</p>
                            </div>
                        </div>
                        <div className="bg-ark-panel border border-ark-border p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-ark-active/20 rounded-full text-ark-primary border border-ark-primary/30">
                                    <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-ark-text">{t('ac_node_sync_status', lang)}</h4>
                                    <p className="text-xs text-green-500 font-mono flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        {t('ac_sync_health', lang)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold font-mono text-ark-text">{nodes.filter(n => n.status === 'online').length}/{nodes.length}</span>
                                <p className="text-xs text-ark-subtext uppercase">{t('ac_total_nodes', lang)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Node Firewall Matrix */}
                    <div>
                        <h3 className="text-sm font-bold text-ark-text mb-3 flex items-center gap-2">
                            <Shield size={16} className="text-ark-primary" />
                            {t('ac_node_firewall_matrix', lang)}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {nodes.map(node => (
                                <div key={node.id} className="bg-ark-panel border border-ark-border p-3 flex flex-col gap-2 hover:border-ark-primary/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            {getOSIcon(node.os)}
                                            <span className="font-bold text-sm text-ark-text">{node.name}</span>
                                        </div>
                                        <ToggleSwitch 
                                            checked={nodeStates[node.id]} 
                                            onChange={() => toggleNodeFirewall(node.id, node.name)} 
                                            loading={pendingToggles.has(node.id)}
                                        />
                                    </div>
                                    <div className="text-xs font-mono text-ark-subtext truncate">{node.ip}</div>
                                    <div className="mt-auto pt-2 border-t border-black/10 dark:border-white/10 flex justify-between items-center">
                                        <span className="text-[10px] font-mono text-ark-subtext uppercase">{getFirewallName(node.os)}</span>
                                        <span className={`text-[10px] font-bold ${
                                            node.firewallStatus === 'active' ? 'text-green-500' : 
                                            node.firewallStatus === 'error' ? 'text-red-500' : 'text-ark-subtext'
                                        }`}>
                                            {node.firewallStatus ? t(`fw_${node.firewallStatus}`, lang) : t('fw_inactive', lang)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-ark-border pb-4 pt-2">
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setActiveTab('blacklist')}
                                className={`px-4 py-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'blacklist' ? 'text-ark-danger border-ark-danger' : 'text-ark-subtext border-transparent hover:text-ark-text'}`}
                            >
                                {t('ac_blacklist', lang)}
                            </button>
                            <button 
                                onClick={() => setActiveTab('whitelist')}
                                className={`px-4 py-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'whitelist' ? 'text-ark-primary border-ark-primary' : 'text-ark-subtext border-transparent hover:text-ark-text'}`}
                            >
                                {t('ac_whitelist', lang)}
                            </button>
                        </div>
                        
                        <div className="flex gap-2">
                            <ArkButton variant="ghost" size="sm" onClick={handleSync} disabled={isSyncing}>
                                <RefreshCw size={14} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} /> 
                                {isSyncing ? t('btn_syncing', lang) : t('ac_btn_sync', lang)}
                            </ArkButton>
                            <ArkButton variant="primary" size="sm" onClick={openAddModal}>
                                <Plus size={14} className="mr-2" /> {t('ac_add_rule', lang)}
                            </ArkButton>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-ark-panel border border-ark-border overflow-hidden">
                        {loading ? (
                            <div className="p-12 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ark-primary"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-ark-active/10 text-ark-subtext font-mono text-xs font-bold uppercase border-b border-ark-border">
                                    <tr>
                                        <th className="p-4">{t('ac_col_ip', lang)}</th>
                                        <th className="p-4">{t('ac_col_reason', lang)}</th>
                                        <th className="p-4">{t('ac_col_source', lang)}</th>
                                        <th className="p-4">{t('ac_col_expires', lang)}</th>
                                        <th className="p-4 text-right">{t('ac_col_actions', lang)}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ark-border font-mono text-xs">
                                    {filteredRules.map(rule => (
                                        <tr key={rule.id} className="hover:bg-ark-active/5 transition-colors">
                                            <td className="p-4 font-bold text-ark-text flex items-center gap-2">
                                                {rule.ip}
                                                {rule.ip.includes('/') && <span className="px-1 py-0.5 rounded text-[9px] bg-ark-bg text-ark-primary/80 border border-ark-border">CIDR</span>}
                                            </td>
                                            <td className="p-4 text-ark-subtext">{rule.reason}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border rounded-sm ${
                                                    rule.source === 'PRTS' 
                                                        ? 'bg-transparent text-ark-primary border-ark-border' 
                                                        : 'bg-ark-subtext/10 text-ark-subtext border-ark-border'
                                                }`}>
                                                    {rule.source === 'PRTS' ? t('ac_source_prts', lang) : t('ac_source_system', lang)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-ark-text">{rule.expireTime || t('ac_permanent', lang)}</td>
                                            <td className="p-4 text-right">
                                                {rule.source === 'PRTS' ? (
                                                    <button onClick={() => handleDelete(rule.id)} className="p-1.5 hover:bg-ark-danger/20 text-ark-subtext hover:text-ark-danger transition-colors rounded-sm">
                                                        <Trash2 size={14} />
                                                    </button>
                                                ) : (
                                                    <Lock size={14} className="text-ark-subtext opacity-50 ml-auto mr-2" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRules.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-ark-subtext">{t('ac_empty_rules', lang)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>

        {/* Add Rule Modal */}
        {isModalOpen && createPortal(
            <div className={"fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 " + (isClosing ? 'opacity-0' : 'opacity-100')}>
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAddModal} />
                
                <div className={"w-full max-w-md bg-ark-panel border border-[#23ade5] shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative flex flex-col " + (isClosing ? 'animate-ark-modal-out' : 'animate-ark-modal-in')}>
                    {/* Corners */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#23ade5]" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#23ade5]" />

                    <div className="flex justify-between items-center p-4 border-b border-ark-border">
                        <h3 className="text-sm font-bold text-ark-text uppercase tracking-[0.2em] flex items-center gap-2">
                            <Plus size={18} className="text-[#23ade5]" /> 
                            {t('ac_add_rule', lang)}
                        </h3>
                        <button onClick={closeAddModal} className="text-ark-subtext hover:text-ark-text transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Target Type Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-ark-subtext uppercase tracking-widest">{t('ac_target_type', lang)}</label>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setFormTargetType('ip')}
                                    className={`flex-1 py-2 text-xs font-bold border flex items-center justify-center gap-2 transition-colors ${formTargetType === 'ip' ? 'bg-ark-primary/10 text-ark-primary border-ark-primary' : 'border-ark-border text-ark-subtext hover:border-ark-primary/50'}`}
                                >
                                    <Monitor size={14} /> {t('ac_type_ip', lang)}
                                </button>
                                <button 
                                    onClick={() => setFormTargetType('cidr')}
                                    className={`flex-1 py-2 text-xs font-bold border flex items-center justify-center gap-2 transition-colors ${formTargetType === 'cidr' ? 'bg-ark-primary/10 text-ark-primary border-ark-primary' : 'border-ark-border text-ark-subtext hover:border-ark-primary/50'}`}
                                >
                                    <Network size={14} /> {t('ac_type_cidr', lang)}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-ark-subtext uppercase tracking-widest">{t('ac_col_ip', lang)}</label>
                            <ArkInput 
                                value={formIp} 
                                onChange={e => setFormIp(e.target.value)} 
                                placeholder={formTargetType === 'ip' ? "192.168.1.100" : "10.0.0.0/24"}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-ark-subtext uppercase tracking-widest">Rule Type</label>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setFormType('blacklist')}
                                    className={`flex-1 py-2 text-xs font-bold border ${formType === 'blacklist' ? 'bg-ark-danger/10 text-ark-danger border-ark-danger' : 'border-ark-border text-ark-subtext'}`}
                                >
                                    {t('ac_blacklist', lang)}
                                    </button>
                                    <button 
                                        onClick={() => setFormType('whitelist')}
                                        className={`flex-1 py-2 text-xs font-bold border ${formType === 'whitelist' ? 'bg-ark-primary/10 text-ark-primary border-ark-primary' : 'border-ark-border text-ark-subtext'}`}
                                    >
                                        {t('ac_whitelist', lang)}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-ark-subtext uppercase tracking-widest">{t('ac_col_reason', lang)}</label>
                                <ArkInput 
                                    value={formReason} 
                                    onChange={e => setFormReason(e.target.value)} 
                                    placeholder={t('ac_placeholder_reason', lang)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-ark-subtext uppercase tracking-widest">{t('ac_col_expires', lang)}</label>
                                <div className="relative">
                                    <select 
                                        value={formDuration}
                                        onChange={e => setFormDuration(e.target.value)}
                                        className="w-full bg-ark-bg border border-ark-border px-3 py-2 text-sm text-ark-text font-mono outline-none focus:border-[#23ade5] appearance-none"
                                    >
                                        <option value="permanent">{t('ac_permanent', lang)}</option>
                                        <option value="1h">{t('ad_duration_1h', lang)}</option>
                                        <option value="24h">{t('ad_duration_24h', lang)}</option>
                                        <option value="7d">{t('ad_duration_7d', lang)}</option>
                                    </select>
                                    <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ark-subtext pointer-events-none" />
                                </div>
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
    </>
);
};
