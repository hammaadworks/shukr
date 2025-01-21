import React, {useEffect, useState} from 'react';
import {ChevronDown, ChevronLeft, Download, Edit2, Mic, RefreshCw, Settings, Trash2, Upload, X, Volume2, VolumeX} from 'lucide-react';
import {translator} from '../lib/translator';
import {universePorter} from '../lib/universePorter';
import {universeDb} from '../lib/universeDb';
import {WordEditor} from './WordEditor';
import {AlertDialog, ConfirmDialog, PromptDialog, SelectDialog} from './modals/Dialogs';

import { useLanguage, SUPPORTED_LANGS } from '../hooks/useLanguage';

interface SettingsPanelProps {
    config: any;
    updateConfig: (newConfig: any) => void;
    onOpenVoiceStudio: () => void;
    onShowLanding?: () => void;
    onClose: () => void;
    initialTab?: TabType;
    initialEditingItem?: any;
}

type EditingType = 'word' | 'category' | 'quote';

type TabType = 'contact' | 'voice' | 'data' | 'general';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
                                                                config,
                                                                updateConfig,
                                                                onOpenVoiceStudio,
                                                                onShowLanding,
                                                                onClose,
                                                                initialTab,
                                                                initialEditingItem
                                                            }) => {
    const { primaryLanguage, secondaryLanguage, setLanguagePair, language, isDualMode, setDualMode } = useLanguage();
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'contact');
    const [editingItem, setEditingItem] = useState<any | null>(initialEditingItem || null);
    const [editingType] = useState<EditingType>(initialEditingItem ? (initialEditingItem.type || 'word') : 'word');
    const [editMode] = useState<'edit' | 'new'>('edit');
    const [isExporting, setIsExporting] = useState(false);

    // Modal States
    const [alertInfo, setAlertInfo] = useState<{ title: string, desc: string } | null>(null);
    const [confirmInfo, setConfirmInfo] = useState<{
        title: string,
        desc: string,
        isDanger?: boolean,
        action: () => void
    } | null>(null);
    const [promptInfo, setPromptInfo] = useState<{
        title: string,
        placeholder?: string,
        defaultValue?: string,
        action: (val: string) => void
    } | null>(null);
    const [showVoiceSelect, setShowVoiceSelect] = useState(false);
    const [showPrimarySelect, setShowPrimarySelect] = useState(false);
    const [showSecondarySelect, setShowSecondarySelect] = useState(false);

    const voiceOptions = [{
        value: 'default',
        label: 'System Default (سیسم ڈیفالٹ)'
    }, ...(config.voiceProfiles || []).map((p: any) => ({value: p.id, label: p.name}))];
    const currentVoiceName = voiceOptions.find(o => o.value === (config?.activeVoiceProfile || 'default'))?.label || 'System Default (سیسم ڈیفالٹ)';

    const handleRenameVoice = () => {
        const activeId = config?.activeVoiceProfile || 'default';
        if (activeId === 'default') {
            setAlertInfo({title: "Cannot Rename", desc: "You cannot rename the system default profile."});
            return;
        }

        const profile = config.voiceProfiles.find((p: any) => p.id === activeId);
        if (!profile) return;

        setPromptInfo({
            title: "Rename Voice Profile",
            placeholder: "e.g. My Voice",
            defaultValue: profile.name,
            action: (newName) => {
                if (!newName.trim()) return;
                const newProfiles = config.voiceProfiles.map((p: any) => p.id === activeId ? {...p, name: newName} : p);
                updateConfig({...config, voiceProfiles: newProfiles});
            }
        });
    };

    // Persistence: Universe Snapshot (Portable Backup)
    const handleExportUniverse = async () => {
        setIsExporting(true);
        try {
            const snapshot = await universePorter.export(config);
            universePorter.download(snapshot);
        } catch (err) {
            setAlertInfo({title: "Backup Failed", desc: "Please check the console for details."});
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportUniverse = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const snapshot = JSON.parse(event.target?.result as string);
                setConfirmInfo({
                    title: "Merge Data",
                    desc: "This will merge the imported data into your current universe. Proceed?",
                    action: async () => {
                        await universePorter.import(snapshot);
                        setAlertInfo({title: "Success", desc: "Universe restored successfully!"});
                        setTimeout(() => window.location.reload(), 1500);
                    }
                });
            } catch (err) {
                setAlertInfo({title: "Error", desc: "Invalid backup file format."});
            }
        };
        reader.readAsText(file);
    };

    // Initialize translator with current config
    useEffect(() => {
        if (config) {
            translator.refresh(config);
        }
    }, [config]);

    const quotes = config?.quotes || [];

    const handleBack = () => {
        if (editingItem) {
            setEditingItem(null);
        } else {
            onClose();
        }
    };

    const handleSave = async (item: any) => {
        const newConfig = {...config};

        switch (editingType) {
            case 'word': {
                // Check for duplicates
                const allWords = newConfig.categories.flatMap((c: any) => c.items || []);
                const isDuplicate = allWords.some((i: any) => i.id !== item.id && (i.en.toLowerCase() === item.en.toLowerCase() || i.ur === item.ur));

                if (isDuplicate) {
                    setAlertInfo({title: "Duplicate Entry", desc: "This word already exists!"});
                    return;
                }

                // Find the correct category and save
                const categoryId = item.categoryId || item.category || 'core';

                newConfig.categories = newConfig.categories.map((cat: any) => ({
                    ...cat,
                    items: cat.id === categoryId ? (editMode === 'new' ? [...cat.items, item] : cat.items.map((i: any) => i.id === item.id ? item : i)) : cat.items
                }));

                // Persist to IndexedDB safely
                await universeDb.words.put({
                    ...item,
                    category: categoryId,
                    type: item.type || 'word',
                    usageCount: item.usageCount || 0,
                    lastUsedAt: item.lastUsedAt || Date.now(),
                    next: item.next || [],
                    tags: item.tags || []
                });
                break;
            }
            case 'quote': {
                let finalQuote = {...item};

                if (editMode === 'new') {
                    finalQuote = {
                        id: `quote_user_${crypto.randomUUID()}`,
                        en: item.en,
                        ur: item.ur,
                        source: item.source || '',
                        createdAt: Date.now()
                    };
                    newConfig.quotes = [finalQuote, ...quotes];
                } else {
                    const idx = quotes.findIndex((q: any) => q.id === item.id || q.en === item.oldEn);
                    if (idx > -1) {
                        finalQuote = {
                            ...quotes[idx], ur: item.ur, en: item.en, source: item.source
                        };
                        newConfig.quotes[idx] = finalQuote;
                    }
                }

                if (finalQuote.id) {
                    await universeDb.quotes.put(finalQuote);
                }
                break;
            }
        }

        updateConfig(newConfig);
        setEditingItem(null);
    };

    const handleDelete = (itemId: string, itemEn?: string) => {
        setConfirmInfo({
            title: "Delete Item?",
            desc: "Are you sure you want to delete this? This action is irreversible.",
            isDanger: true,
            action: async () => {
                const newConfig = {...config};

                switch (editingType) {
                    case 'word': {
                        newConfig.categories = newConfig.categories.map((cat: any) => ({
                            ...cat, items: cat.items.filter((i: any) => i.id !== itemId)
                        }));
                        // Remove from IndexedDB securely
                        await universeDb.words.delete(itemId);
                        break;
                    }
                    case 'quote': {
                        newConfig.quotes = quotes.filter((q: any) => q.id !== itemId && q.en !== itemEn);
                        if (itemId) {
                            await universeDb.quotes.delete(itemId);
                        } else if (itemEn) {
                            // Fallback for older quotes without an ID
                            const qToDelete = await universeDb.quotes.where('en').equals(itemEn).first();
                            if (qToDelete && qToDelete.id) {
                                await universeDb.quotes.delete(qToDelete.id);
                            }
                        }
                        break;
                    }
                }

                updateConfig(newConfig);
                setEditingItem(null);
            }
        });
    };

    return (<div className="settings-panel naani-friendly">
        {/* Header */}
        <div className="settings-header">
            <button className="btn-icon large-icon" onClick={handleBack}>
                {editingItem ? <X size={32}/> : <ChevronLeft size={36}/>}
            </button>
            <h2>
                {editingItem ? (editMode === 'new' ? 'Add New' : 'Edit') : 'Settings'}
            </h2>
        </div>

        {/* Tabs */}
        {!editingItem && (<div className="settings-tabs">
            {[
                {id: 'contact', label: 'Call', urdu: 'کال کریں', icon: Settings}, 
                {id: 'voice', label: 'Voice', urdu: 'آواز', icon: Mic}, 
                {id: 'data', label: 'Data', urdu: 'ڈیٹا', icon: RefreshCw},
                {id: 'general', label: 'General', urdu: 'عام', icon: Settings},
            ].map(tab => (<button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as TabType)}
            >
                {language === 'ur' ? (<span className="urdu-tab">{tab.urdu}</span>) : (tab.label)}
            </button>))}
        </div>)}

        <div className="settings-content">
            {!editingItem && (<>
                {/* Contact Settings */}
                {activeTab === 'contact' && (<div className="gestures-settings-container">
                    <div className="list-group">
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-primary)', fontSize: '1.2rem' }}>SOS Template (پیغام)</h3>
                            <textarea 
                                className="massive-input"
                                style={{ width: '100%', height: 100, padding: 16, fontSize: '1.1rem', borderRadius: 24 }}
                                placeholder="I need help!"
                                value={config.sos_settings?.message_template || ''}
                                onChange={(e) => {
                                    const newConfig = { ...config };
                                    if (!newConfig.sos_settings) newConfig.sos_settings = {};
                                    newConfig.sos_settings.message_template = e.target.value;
                                    updateConfig(newConfig);
                                }}
                            />
                        </div>

                        <div className="massive-item" style={{ height: 100, marginBottom: 24 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>Countdown</span>
                                <span className="urdu-tab" style={{ fontSize: '1.4rem', color: 'var(--color-primary)' }}>الٹی گنتی (سیکنڈ)</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[3, 5, 10].map(sec => (
                                    <button
                                        key={sec}
                                        className={`btn-icon ${config.sos_settings?.countdown_seconds === sec ? 'active' : ''}`}
                                        style={{ 
                                            width: 60, height: 60, borderRadius: 18, fontSize: '1.2rem', fontWeight: 900,
                                            background: config.sos_settings?.countdown_seconds === sec ? 'var(--color-primary)' : 'white',
                                            color: config.sos_settings?.countdown_seconds === sec ? 'white' : 'var(--color-primary)',
                                            border: '1px solid var(--color-primary)'
                                        }}
                                        onClick={() => {
                                            const newConfig = { ...config };
                                            if (!newConfig.sos_settings) newConfig.sos_settings = {};
                                            newConfig.sos_settings.countdown_seconds = sec;
                                            updateConfig(newConfig);
                                        }}
                                    >
                                        {sec}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-primary)', fontSize: '1.2rem' }}>Emergency Contacts (ایمرجنسی نمبر)</h3>
                        {(config.emergency_contacts || []).map((contact: any, idx: number) => (
                            <div key={idx} className="massive-item"
                                 style={{flexDirection: 'column', gap: 12, marginBottom: 12}}>
                                <div style={{display: 'flex', width: '100%', gap: 12}}>
                                    <input
                                        className="massive-input"
                                        dir="ltr"
                                        style={{flex: 1}}
                                        placeholder="Name (نام)"
                                        value={contact.name}
                                        onChange={(e) => {
                                            const newConfig = {...config};
                                            newConfig.emergency_contacts[idx].name = e.target.value;
                                            updateConfig(newConfig);
                                        }}
                                    />
                                    <input
                                        className="massive-input"
                                        dir="ltr"
                                        style={{flex: 1.5}}
                                        placeholder="Phone (فون نمبر)"
                                        value={contact.phone}
                                        onChange={(e) => {
                                            const newConfig = {...config};
                                            newConfig.emergency_contacts[idx].phone = e.target.value;
                                            updateConfig(newConfig);
                                        }}
                                    />
                                </div>
                            </div>))}
                    </div>
                </div>)}

                {/* Voice Settings */}
                {activeTab === 'voice' && (<div className="gestures-settings-container">
                    <div style={{display: 'flex', gap: 12, marginBottom: 12}}>
                        <button
                            className="massive-input"
                            dir="ltr"
                            style={{
                                flex: 1,
                                textAlign: 'left',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                height: 84,
                                borderRadius: 24,
                                fontSize: '1.2rem'
                            }}
                            onClick={() => setShowVoiceSelect(true)}
                        >
                            <span>{currentVoiceName}</span>
                            <ChevronDown size={24} color="var(--color-text-muted)"/>
                        </button>

                        {(config?.activeVoiceProfile && config.activeVoiceProfile !== 'default') && (<button
                                className="btn-icon"
                                style={{
                                    background: 'var(--color-bg)',
                                    border: '1px solid rgba(45,90,39,0.1)',
                                    height: 84,
                                    width: 84,
                                    borderRadius: 24
                                }}
                                onClick={handleRenameVoice}
                            >
                                <Edit2 size={28} color="var(--color-primary)"/>
                            </button>)}
                    </div>

                    <button
                        className="btn-primary huge-btn w-full"
                        style={{
                            background: '#ff3b30',
                            height: 180,
                            color: 'white',
                            borderRadius: 36,
                            boxShadow: '0 12px 30px rgba(255,59,48,0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            marginBottom: 24
                        }}
                        onClick={() => onOpenVoiceStudio()}
                    >
                        <Mic size={56}/>
                        <span style={{fontSize: '1.6rem', fontWeight: 900}}>ریکارڈنگ ہوم (Open Voice Studio)</span>
                    </button>
                </div>)}

                {/* Data Settings (System) */}
                {activeTab === 'data' && (<div className="gestures-settings-container">
                    <div className="list-group">
                        <div className="list-item massive-item"
                             style={{flexDirection: 'column', alignItems: 'flex-start', gap: 16}}>
                            <div style={{width: '100%'}}>
                                <h3 style={{margin: 0, color: 'var(--color-primary)'}}>App Introduction (تعارف)</h3>
                                <p style={{fontSize: '0.9rem', color: '#8e8e93', marginTop: 4}}>
                                    View the app's features and overview on the landing page.
                                </p>
                            </div>
                            <button className="btn-save w-full" style={{
                                background: 'white',
                                color: 'var(--color-primary)',
                                border: '1px solid var(--color-primary)',
                                boxShadow: 'none'
                            }} onClick={onShowLanding}>
                                View Landing Page
                            </button>
                        </div>

                        <div className="list-item massive-item"
                             style={{flexDirection: 'column', alignItems: 'flex-start', gap: 16}}>
                            <div style={{width: '100%'}}>
                                <h3 style={{margin: 0, color: 'var(--color-primary)'}}>Cloud Backup (بیک
                                    اپ)</h3>
                                <p dir="ltr" style={{
                                    fontSize: '0.9rem', color: '#8e8e93', marginTop: 4, textAlign: 'inherit'
                                }}>
                                    Download your entire universe (words, voices, sketches) as a single
                                    portable file.
                                </p>
                            </div>
                            <button className="btn-save w-full" onClick={handleExportUniverse}
                                    disabled={isExporting}>
                                {isExporting ? <RefreshCw size={24} className="animate-spin"/> : <Download size={24}/>}
                                {isExporting ? "Exporting..." : "Backup Universe"}
                            </button>
                        </div>

                        <div className="list-item massive-item"
                             style={{flexDirection: 'column', alignItems: 'flex-start', gap: 16}}>
                            <div style={{width: '100%'}}>
                                <h3 style={{margin: 0, color: 'var(--color-primary)'}}>Restore Data (بحال
                                    کریں)</h3>
                                <p style={{fontSize: '0.9rem', color: '#8e8e93', marginTop: 4}}>
                                    Restore your universe from a previously saved backup file.
                                </p>
                            </div>
                            <label className="btn-save w-full" style={{
                                cursor: 'pointer',
                                background: '#f2f2f7',
                                color: 'var(--color-primary)',
                                boxShadow: 'none',
                                border: '1px solid rgba(45,90,39,0.1)'
                            }}>
                                <Upload size={24}/>
                                Restore from File
                                <input type="file" accept=".json" onChange={handleImportUniverse}
                                       style={{display: 'none'}}/>
                            </label>
                        </div>

                        <div className="list-item massive-item"
                             style={{flexDirection: 'column', alignItems: 'flex-start', gap: 16, borderTop: '1px solid #eee', paddingTop: 24, marginTop: 12}}>
                            <div style={{width: '100%'}}>
                                <h3 style={{margin: 0, color: '#ff3b30'}}>Hard Reset (مکمل ری سیٹ)</h3>
                                <p style={{fontSize: '0.9rem', color: '#8e8e93', marginTop: 4}}>
                                    Clear all local data and reset the version back to 1.
                                </p>
                            </div>
                            <button 
                                className="btn-save w-full" 
                                style={{
                                    background: '#ff3b30', 
                                    color: 'white',
                                    boxShadow: '0 8px 20px rgba(255,59,48,0.2)'
                                }}
                                onClick={() => {
                                    setConfirmInfo({
                                        title: "Hard Reset?",
                                        desc: "This will DELETE all your custom words, voices, and reset the app. Are you absolutely sure?",
                                        isDanger: true,
                                        action: async () => {
                                            localStorage.removeItem('shukr_last_boot_version');
                                            localStorage.removeItem('shukr_last_boot_ts');
                                            localStorage.removeItem('shukr_app_config');
                                            await universePorter.clearAllLocalData();
                                            window.location.reload();
                                        }
                                    });
                                }}
                            >
                                <Trash2 size={24}/>
                                Hard Reset App
                            </button>
                        </div>
                    </div>
                </div>)}

                {/* General Settings */}
                {activeTab === 'general' && (<div className="gestures-settings-container">
                    <div className="list-group">
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-primary)', fontSize: '1.2rem' }}>User Nickname (نام)</h3>
                            <input 
                                className="massive-input"
                                style={{ width: '100%', height: 70, padding: 16, fontSize: '1.2rem', borderRadius: 24 }}
                                placeholder="e.g. Bade Ammi"
                                value={config.user_nickname || ''}
                                onChange={(e) => {
                                    updateConfig({ ...config, user_nickname: e.target.value });
                                }}
                            />
                        </div>

                        <div className="list-item massive-item"
                             style={{flexDirection: 'column', alignItems: 'flex-start', gap: 16, marginBottom: 24}}>
                            <div style={{width: '100%'}}>
                                <h3 style={{margin: 0, color: 'var(--color-primary)'}}>Language Pair (زبان کا انتخاب)</h3>
                                <p style={{fontSize: '0.9rem', color: '#8e8e93', marginTop: 4}}>
                                    Select the language pair for the User and Caregiver.
                                </p>
                            </div>
                            
                            <div style={{ display: 'flex', width: '100%', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', display: 'block', marginBottom: 4 }}>Primary (User)</label>
                                    <button 
                                        className="massive-input" 
                                        style={{ width: '100%', height: 60, fontSize: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                        onClick={() => setShowPrimarySelect(true)}
                                    >
                                        <span>{SUPPORTED_LANGS.find(l => l.code === primaryLanguage)?.label}</span>
                                        <ChevronDown size={20} />
                                    </button>
                                </div>
                                {isDualMode && (
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', display: 'block', marginBottom: 4 }}>Secondary (Helper)</label>
                                        <button 
                                            className="massive-input" 
                                            style={{ width: '100%', height: 60, fontSize: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                            onClick={() => setShowSecondarySelect(true)}
                                        >
                                            <span>{SUPPORTED_LANGS.find(l => l.code === secondaryLanguage)?.label}</span>
                                            <ChevronDown size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="massive-item" style={{ height: 100, marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ 
                                    background: isDualMode ? 'rgba(45,90,39,0.1)' : '#f2f2f7',
                                    padding: 16,
                                    borderRadius: 18,
                                    color: isDualMode ? 'var(--color-primary)' : '#8e8e93'
                                }}>
                                    <RefreshCw size={32}/>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>Dual Language</span>
                                    <span className="urdu-tab" style={{ fontSize: '1.4rem', color: 'var(--color-primary)', lineHeight: 1 }}>دوہری زبان</span>
                                </div>
                            </div>
                            <button 
                                className={`huge-btn ${isDualMode ? 'active' : ''}`}
                                style={{ 
                                    width: 120, 
                                    height: 64, 
                                    borderRadius: 32,
                                    background: isDualMode ? 'var(--color-primary)' : '#e5e5ea',
                                    color: isDualMode ? 'white' : '#8e8e93',
                                    transition: 'all 0.3s ease',
                                    fontSize: '1.2rem',
                                    fontWeight: 900
                                }}
                                onClick={() => {
                                    setDualMode(!isDualMode);
                                }}
                            >
                                {isDualMode ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-primary)', fontSize: '1.2rem' }}>Speech Rate (رفتار)</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <input 
                                    type="range"
                                    min="0.5"
                                    max="1.5"
                                    step="0.1"
                                    style={{ flex: 1, height: 12, accentColor: 'var(--color-primary)' }}
                                    value={config.preferences?.speech_rate || 0.9}
                                    onChange={(e) => {
                                        const newConfig = { ...config };
                                        if (!newConfig.preferences) newConfig.preferences = {};
                                        newConfig.preferences.speech_rate = parseFloat(e.target.value);
                                        updateConfig(newConfig);
                                    }}
                                />
                                <span style={{ fontSize: '1.2rem', fontWeight: 900, width: 40 }}>{config.preferences?.speech_rate || 0.9}</span>
                            </div>
                        </div>

                        <div className="massive-item" style={{ height: 100 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ 
                                    background: config.preferences?.enable_click_sound !== false ? 'rgba(45,90,39,0.1)' : '#f2f2f7',
                                    padding: 16,
                                    borderRadius: 18,
                                    color: config.preferences?.enable_click_sound !== false ? 'var(--color-primary)' : '#8e8e93'
                                }}>
                                    {config.preferences?.enable_click_sound !== false ? <Volume2 size={32}/> : <VolumeX size={32}/>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>Button Sound</span>
                                    <span className="urdu-tab" style={{ fontSize: '1.4rem', color: 'var(--color-primary)', lineHeight: 1 }}>بٹن کی آواز</span>
                                </div>
                            </div>
                            <button 
                                className={`huge-btn ${config.preferences?.enable_click_sound !== false ? 'active' : ''}`}
                                style={{ 
                                    width: 120, 
                                    height: 64, 
                                    borderRadius: 32,
                                    background: config.preferences?.enable_click_sound !== false ? 'var(--color-primary)' : '#e5e5ea',
                                    color: config.preferences?.enable_click_sound !== false ? 'white' : '#8e8e93',
                                    transition: 'all 0.3s ease',
                                    fontSize: '1.2rem',
                                    fontWeight: 900
                                }}
                                onClick={() => {
                                    const newConfig = { ...config };
                                    if (!newConfig.preferences) newConfig.preferences = {};
                                    newConfig.preferences.enable_click_sound = config.preferences?.enable_click_sound !== false ? false : true;
                                    updateConfig(newConfig);
                                }}
                            >
                                {config.preferences?.enable_click_sound !== false ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>
                </div>)}
            </>)}

            {/* Edit Form */}
            {editingItem && (<WordEditor
                item={editingItem}
                isNew={editMode === 'new'}
                onChange={(newItem) => setEditingItem({...editingItem, ...newItem})}
                onSave={handleSave}
                onDelete={handleDelete}
                existingWords={(config?.categories || []).flatMap((c: any) => c.items || [])}
            />)}
        </div>

        {/* Modals */}
        <AlertDialog
            isOpen={!!alertInfo}
            onClose={() => setAlertInfo(null)}
            title={alertInfo?.title || ''}
            description={alertInfo?.desc || ''}
        />

        <ConfirmDialog
            isOpen={!!confirmInfo}
            onClose={() => setConfirmInfo(null)}
            title={confirmInfo?.title || ''}
            description={confirmInfo?.desc || ''}
            isDanger={confirmInfo?.isDanger}
            onConfirm={() => confirmInfo?.action()}
        />

        <PromptDialog
            isOpen={!!promptInfo}
            onClose={() => setPromptInfo(null)}
            title={promptInfo?.title || ''}
            placeholder={promptInfo?.placeholder}
            defaultValue={promptInfo?.defaultValue}
            onSubmit={(val) => promptInfo?.action(val)}
        />

        <SelectDialog
            isOpen={showVoiceSelect}
            onClose={() => setShowVoiceSelect(false)}
            title="Select Voice Profile"
            options={voiceOptions}
            selectedValue={config?.activeVoiceProfile || 'default'}
            onSelect={(val) => {
                const newConfig = {...config, activeVoiceProfile: val};
                updateConfig(newConfig);
            }}
        />

        <SelectDialog
            isOpen={showPrimarySelect}
            onClose={() => setShowPrimarySelect(false)}
            title="Primary Language (User)"
            options={SUPPORTED_LANGS.filter(l => l.code !== secondaryLanguage).map(l => ({ value: l.code, label: l.label }))}
            selectedValue={primaryLanguage}
            onSelect={(val) => setLanguagePair(val, secondaryLanguage)}
        />

        <SelectDialog
            isOpen={showSecondarySelect}
            onClose={() => setShowSecondarySelect(false)}
            title="Secondary Language (Helper)"
            options={SUPPORTED_LANGS.filter(l => l.code !== primaryLanguage).map(l => ({ value: l.code, label: l.label }))}
            selectedValue={secondaryLanguage}
            onSelect={(val) => setLanguagePair(primaryLanguage, val)}
        />
    </div>);
};
