import React, {useEffect, useState} from 'react';
import {ChevronLeft, Download, Mic, RefreshCw, Settings, Upload, X} from 'lucide-react';
import {translator} from '../lib/translator';
import {db} from '../recognition/db';
import {universePorter} from '../lib/universePorter';
import {universeDb} from '../lib/universeDb';
import {WordEditor} from './WordEditor';
import { AlertDialog, ConfirmDialog, PromptDialog, SelectDialog } from './modals/Dialogs';
import { ChevronDown } from 'lucide-react';

interface SettingsPanelProps {
    config: any;
    updateConfig: (newConfig: any) => void;
    onOpenVoiceStudio: () => void;
    onClose: () => void;
    initialTab?: TabType;
    initialEditingItem?: any;
}

type EditingType = 'word' | 'category' | 'quote';

type TabType = 'contact' | 'voice' | 'data';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
                                                                config,
                                                                updateConfig,
                                                                onOpenVoiceStudio,
                                                                onClose,
                                                                initialTab,
                                                                initialEditingItem
                                                            }) => {
    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'contact');
    const [editingItem, setEditingItem] = useState<any | null>(initialEditingItem || null);
    const [editingType] = useState<EditingType>(initialEditingItem ? (initialEditingItem.type || 'word') : 'word');
    const [editMode] = useState<'edit' | 'new'>('edit');
    const [isExporting, setIsExporting] = useState(false);

    // Modal States
    const [alertInfo, setAlertInfo] = useState<{title: string, desc: string} | null>(null);
    const [confirmInfo, setConfirmInfo] = useState<{title: string, desc: string, isDanger?: boolean, action: () => void} | null>(null);
    const [promptInfo, setPromptInfo] = useState<{title: string, placeholder?: string, defaultValue?: string, action: (val: string) => void} | null>(null);
    const [showVoiceSelect, setShowVoiceSelect] = useState(false);

    const voiceOptions = [
        { value: 'default', label: 'System Default (سیسم ڈیفالٹ)' },
        ...(config.voiceProfiles || []).map((p: any) => ({ value: p.id, label: p.name }))
    ];
    const currentVoiceName = voiceOptions.find(o => o.value === (config?.activeVoiceProfile || 'default'))?.label || 'System Default (سیسم ڈیفالٹ)';

    // Persistence: Universe Snapshot (Portable Backup)
    const handleExportUniverse = async () => {
        setIsExporting(true);
        try {
            const snapshot = await universePorter.export(config);
            universePorter.download(snapshot);
        } catch (err) {
            setAlertInfo({ title: "Backup Failed", desc: "Please check the console for details." });
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
                        setAlertInfo({ title: "Success", desc: "Universe restored successfully!" });
                        setTimeout(() => window.location.reload(), 1500);
                    }
                });
            } catch (err) {
                setAlertInfo({ title: "Error", desc: "Invalid backup file format." });
            }
        };
        reader.readAsText(file);
    };

    // Persistence: Export Training Data (Doodles)
    const exportTrainingData = async () => {
        const templates = await db.templates.toArray();
        const dataStr = JSON.stringify(templates, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shukr_training_data_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Persistence: Import Training Data
    const importTrainingData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const templates = JSON.parse(event.target?.result as string);
                if (Array.isArray(templates)) {
                    await db.templates.bulkAdd(templates);
                    setAlertInfo({ title: "Success", desc: "Training data imported successfully!" });
                    setTimeout(() => window.location.reload(), 1500);
                }
            } catch (err) {
                setAlertInfo({ title: "Error", desc: "Invalid file format for training data." });
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
                    setAlertInfo({ title: "Duplicate Entry", desc: "This word already exists!" });
                    return;
                }

                // Find the correct category and save
                const categoryId = item.categoryId || item.category || 'core';
                
                newConfig.categories = newConfig.categories.map((cat: any) => ({
                    ...cat, items: cat.id === categoryId ? (editMode === 'new' ? [...cat.items, item] : cat.items.map((i: any) => i.id === item.id ? item : i)) : cat.items
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
                let finalQuote = { ...item };
                
                if (editMode === 'new') {
                    finalQuote = {
                        id: `quote_user_${Date.now()}`,
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
                            ...quotes[idx], 
                            ur: item.ur, 
                            en: item.en, 
                            source: item.source 
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
            {[{id: 'contact', label: 'Contact', urdu: 'رابطہ', icon: Settings}, {
                id: 'voice', label: 'Voice', urdu: 'آواز', icon: Mic
            }, {id: 'data', label: 'Data', urdu: 'ڈیٹا', icon: RefreshCw},].map(tab => (<button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as TabType)}
            >
                {document.documentElement.lang === 'ur' ? (<span className="urdu-tab">{tab.urdu}</span>) : (tab.label)}
            </button>))}
        </div>)}

        <div className="settings-content">
            {!editingItem && (<>
                {/* Contact Settings */}
                {activeTab === 'contact' && (<div className="gestures-settings-container">
                    <div style={{width: '100%', marginBottom: 16}}>
                        <h3 style={{margin: 0, color: 'var(--color-primary)'}}>Emergency Contacts (ہنگامی
                            رابطے)</h3>
                        <p dir="ltr" style={{
                            fontSize: '0.9rem', color: '#8e8e93', marginTop: 4, textAlign: 'inherit'
                        }}>
                            Configure the contacts shown in the SOS screen.
                        </p>
                    </div>
                    <div className="list-group">
                        {(config.emergency_contacts || []).map((contact: any, idx: number) => (
                            <div key={idx} className="massive-item"
                                 style={{flexDirection: 'column', gap: 12}}>
                                <div style={{display: 'flex', width: '100%', gap: 12}}>
                                    <input
                                        className="massive-input"
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
                    <div className="list-group">
                        <div style={{width: '100%', marginBottom: 24}}>
                            <h3 style={{margin: 0, color: 'var(--color-primary)', fontSize: '1.4rem'}}>Voice & Sound (آواز)</h3>
                            <p dir="ltr" style={{
                                fontSize: '1.05rem', color: '#666', marginTop: 8, textAlign: 'inherit'
                            }}>
                                Choose the active voice profile or record your own.
                            </p>
                        </div>
                        
                        <div className="list-item massive-item"
                             style={{flexDirection: 'column', alignItems: 'stretch', gap: 16}}>
                            <label className="massive-label-ur" style={{display: 'flex', flexDirection: 'column'}}>
                                <span>فعال آواز</span>
                                <span dir="ltr" style={{fontFamily: 'var(--font-primary)', fontSize: '1rem', color: 'var(--color-text-muted)'}}>Active Voice Profile</span>
                            </label>
                            
                            <button
                                className="massive-input"
                                dir="ltr"
                                style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => setShowVoiceSelect(true)}
                            >
                                <span>{currentVoiceName}</span>
                                <ChevronDown size={20} color="var(--color-text-muted)" />
                            </button>
                        </div>
                    </div>

                    <button
                        className="btn-primary huge-btn w-full mt-6"
                        style={{background: '#ff3b30', height: 100, color: 'white', borderRadius: 28, boxShadow: '0 8px 20px rgba(255,59,48,0.3)'}}
                        onClick={() => onOpenVoiceStudio()}
                    >
                        <Mic size={32}/> 
                        <span style={{fontSize: '1.2rem', fontWeight: 900}}>ریکارڈنگ ہوم (Open Voice Studio)</span>
                    </button>
                </div>)}

                {/* Data Settings (System) */}
                {activeTab === 'data' && (<div className="gestures-settings-container">
                    <p className="settings-hint">
                        Manage your data. Backup everything to a single file.
                        <br/><i>اپنا ڈیٹا سنبھالیں اور بیک اپ لیں۔</i>
                    </p>
                    <div className="list-group">
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

                        <div className="action-buttons-row" style={{marginTop: 24}}>
                            <button className="btn-save" style={{background: '#0a84ff'}}
                                    onClick={exportTrainingData}>
                                Export Sketches (ڈرائنگ محفوظ کریں)
                            </button>
                            <div className="btn-delete" style={{background: '#333', position: 'relative'}}>
                                Import Sketches (ڈرائنگ لائیں)
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={importTrainingData}
                                    style={{position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer'}}
                                />
                            </div>
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
    </div>);
};
