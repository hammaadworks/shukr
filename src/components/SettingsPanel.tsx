import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Plus, X, 
  Settings, Heart, Mic, Activity,
  Download, Upload, RefreshCw
} from 'lucide-react';
import { translator } from '../lib/translator';

interface SettingsPanelProps {
  config: any;
  updateConfig: (newConfig: any) => void;
  onOpenVoiceStudio: () => void;
  onClose: () => void;
  initialTab?: TabType;
  initialEditingItem?: any;
}

type EditingType = 'word' | 'category' | 'quote' | 'gesture';

type TabType = 'general' | 'motivate' | 'data' | 'gestures';

import { db } from '../recognition/db';
import { universePorter } from '../lib/universePorter';
import { WordEditor } from './WordEditor';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, updateConfig, onOpenVoiceStudio, onClose, initialTab, initialEditingItem }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'general');
  const [editingItem, setEditingItem] = useState<any | null>(initialEditingItem || null);
  const [editingType, setEditingType] = useState<EditingType>(initialEditingItem ? (initialEditingItem.type === 'gesture' ? 'gesture' : 'quote') : 'word');

  const gestureMappings = config?.gesture_map || {
    mouth_open: 'SPEAK',
    one_finger: 'DOODLE',
    thumb_up: 'YES',
    peace_sign: 'SALAM',
    five_fingers: 'CALL_CONTACT_1'
  };

  const handleGestureChange = (key: string, action: string) => {
    const newConfig = { ...config };
    if (!newConfig.gesture_map) newConfig.gesture_map = { ...gestureMappings };
    newConfig.gesture_map[key] = action;
    updateConfig(newConfig);
  };

  const GESTURE_LABELS: Record<string, {en: string, ur: string}> = {
    mouth_open: { en: 'Mouth Open', ur: 'منہ کھولیں' },
    one_finger: { en: '1 Finger', ur: '1 انگلی' },
    thumb_up: { en: 'Thumb Up', ur: 'انگوٹھا' },
    peace_sign: { en: '2 Fingers', ur: '2 انگلیاں' },
    five_fingers: { en: 'Full Palm', ur: 'ہتھیلی' }
  };

  const GESTURE_ACTIONS = [
    { value: 'SPEAK', en: 'Speak Sentence', ur: 'جملہ بولیں' },
    { value: 'DOODLE', en: 'Open Doodle', ur: 'ڈرائنگ' },
    { value: 'YES', en: 'Say Yes', ur: 'جی ہاں' },
    { value: 'SALAM', en: 'Say Salam', ur: 'سلام' },
    { value: 'CALL_CONTACT_1', en: 'Emergency Call', ur: 'ایمرجنسی کال' },
    { value: 'HOME', en: 'Go Home', ur: 'ہوم' },
    { value: 'CLEAR', en: 'Clear Sentence', ur: 'صاف کریں' }
  ];
  const [editMode, setEditMode] = useState<'edit' | 'new'>('edit');
  const [isExporting, setIsExporting] = useState(false);

  // Persistence: Universe Snapshot (Portable Backup)
  const handleExportUniverse = async () => {
    setIsExporting(true);
    try {
      const snapshot = await universePorter.export();
      universePorter.download(snapshot);
    } catch (err) {
      alert("Backup failed. Check console.");
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
        if (window.confirm("This will merge data. Proceed?")) {
          await universePorter.import(snapshot);
          alert("Universe restored successfully!");
          window.location.reload();
        }
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  // Persistence: Export Training Data (Doodles)
  const exportTrainingData = async () => {
    const templates = await db.templates.toArray();
    const dataStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
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
          alert('Training data imported successfully!');
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid file format.');
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
    const newConfig = { ...config };

    switch (editingType) {
      case 'quote':
        if (editMode === 'new') {
          newConfig.quotes = [item, ...quotes];
        } else {
          const idx = quotes.findIndex((q: any) => q.en === item.oldEn);
          if (idx > -1) newConfig.quotes[idx] = { ur: item.ur, en: item.en, source: item.source };
        }
        break;
    }

    updateConfig(newConfig);
    setEditingItem(null);
  };

  const handleDelete = (_itemId: string, itemEn?: string) => {
    if (!window.confirm("حذف کریں؟ / Delete?")) return;
    const newConfig = { ...config };

    switch (editingType) {
      case 'quote':
        newConfig.quotes = quotes.filter((q: any) => q.en !== itemEn);
        break;
    }

    updateConfig(newConfig);
    setEditingItem(null);
  };

  return (
    <div className="settings-panel naani-friendly">
      {/* Header */}
      <div className="settings-header">
        <button className="btn-icon large-icon" onClick={handleBack}>
          {editingItem ? <X size={32} /> : <ChevronLeft size={36} />}
        </button>
        <h2>
          {editingItem ? (editMode === 'new' ? 'Add New' : 'Edit') : 'Settings'}
        </h2>
      </div>

      {/* Tabs */}
      {!editingItem && (
        <div className="settings-tabs">
          {[
            { id: 'general', label: 'General', urdu: 'عام', icon: Settings },
            { id: 'motivate', label: 'Motivate', urdu: 'خوشی', icon: Heart },
            { id: 'data', label: 'Data', urdu: 'ڈیٹا', icon: RefreshCw },
            { id: 'gestures', label: 'Gestures', urdu: 'اشارے', icon: Activity }
          ].map(tab => (
            <button 
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} 
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              {document.documentElement.lang === 'ur' ? (
                <span className="urdu-tab">{tab.urdu}</span>
              ) : (
                tab.label
              )}
            </button>
          ))}
        </div>
      )}

      <div className="settings-content">
        {!editingItem && (
          <>
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="gestures-settings-container">
                <div style={{ width: '100%', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Emergency Contacts (ہنگامی رابطے)</h3>
                  <p dir="ltr" style={{ fontSize: '0.9rem', color: '#8e8e93', marginTop: 4, textAlign: 'inherit' }}>
                    Configure the contacts shown in the SOS screen.
                  </p>
                </div>
                <div className="list-group">
                    {(config.emergency_contacts || []).map((contact: any, idx: number) => (
                      <div key={idx} className="massive-item" style={{ flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', width: '100%', gap: 12 }}>
                          <input 
                            className="massive-input" 
                            style={{ flex: 1 }}
                            placeholder="Name (نام)"
                            value={contact.name}
                            onChange={(e) => {
                              const newConfig = { ...config };
                              newConfig.emergency_contacts[idx].name = e.target.value;
                              updateConfig(newConfig);
                            }}
                          />
                          <input 
                            className="massive-input" 
                            style={{ flex: 1.5 }}
                            placeholder="Phone (فون نمبر)"
                            value={contact.phone}
                            onChange={(e) => {
                              const newConfig = { ...config };
                              newConfig.emergency_contacts[idx].phone = e.target.value;
                              updateConfig(newConfig);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>

                <div className="list-group" style={{ marginTop: 32 }}>
                   <div style={{ width: '100%', marginBottom: 16 }}>
                      <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Voice & Sound (آواز)</h3>
                      <p dir="ltr" style={{ fontSize: '0.9rem', color: '#8e8e93', marginTop: 4, textAlign: 'inherit' }}>
                        Choose the active voice profile or record your own.
                      </p>
                    </div>
                    <div className="list-item massive-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <label style={{ fontSize: 18, marginBottom: 12, color: '#8e8e93' }}>Active Voice Profile (فعال آواز)</label>
                      <select 
                        className="massive-input"
                        value={config?.activeVoiceProfile || 'default'}
                        onChange={(e) => {
                          const newConfig = { ...config, activeVoiceProfile: e.target.value };
                          updateConfig(newConfig);
                        }}
                      >
                        <option value="default">System Default (سیسم ڈیفالٹ)</option>
                        {(config.voiceProfiles || [
                          { id: 'voice_1', name: 'Family Voice 1' },
                          { id: 'voice_2', name: 'Family Voice 2' }
                        ]).map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                </div>

                <button 
                  className="btn-primary huge-btn w-full mt-4" 
                  style={{ background: '#ff3b30', height: 100 }}
                  onClick={() => onOpenVoiceStudio()}
                >
                  <Mic size={32} /> Open Voice Studio (ریکارڈنگ ہوم)
                </button>
              </div>
            )}

            {/* Motivate List (Spiritual) */}
            {activeTab === 'motivate' && (
              <div className="quotes-list-container">
                <button className="btn-primary huge-btn" onClick={() => {
                  setEditMode('new');
                  setEditingType('quote');
                  setEditingItem({ ur: '', en: '', source: '' });
                }}>
                  <Plus size={28} /> Add Quote (نیا جملہ)
                </button>
                {quotes.map((q: any, i: number) => (
                  <div key={i} className="list-item massive-item" onClick={() => {
                    setEditMode('edit');
                    setEditingType('quote');
                    setEditingItem({ ...q, oldEn: q.en });
                  }}>
                    <div className="item-info">
                      <span className="urdu-massive">{q.ur}</span>
                      <span className="english-large">{q.en}</span>
                      <small>{q.source}</small>
                    </div>
                    <Settings size={24} />
                  </div>
                ))}
              </div>
            )}

            {/* Data Settings (System) */}
            {activeTab === 'data' && (
              <div className="gestures-settings-container">
                <p className="settings-hint">
                  Manage your data. Backup everything to a single file.
                  <br/><i>اپنا ڈیٹا سنبھالیں اور بیک اپ لیں۔</i>
                </p>
                <div className="list-group">
                  <div className="list-item massive-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: '100%' }}>
                      <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Cloud Backup (بیک اپ)</h3>
                      <p dir="ltr" style={{ fontSize: '0.9rem', color: '#8e8e93', marginTop: 4, textAlign: 'inherit' }}>
                        Download your entire universe (words, voices, sketches) as a single portable file.
                      </p>
                    </div>
                    <button className="btn-save w-full" onClick={handleExportUniverse} disabled={isExporting}>
                      {isExporting ? <RefreshCw size={24} className="animate-spin" /> : <Download size={24} />}
                      {isExporting ? "Exporting..." : "Backup Universe"}
                    </button>
                  </div>

                  <div className="list-item massive-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: '100%' }}>
                      <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Restore Data (بحال کریں)</h3>
                      <p style={{ fontSize: '0.9rem', color: '#8e8e93', marginTop: 4 }}>
                        Restore your universe from a previously saved backup file.
                      </p>
                    </div>
                    <label className="btn-save w-full" style={{ cursor: 'pointer', background: '#f2f2f7', color: 'var(--color-primary)', boxShadow: 'none', border: '1px solid rgba(45,90,39,0.1)' }}>
                      <Upload size={24} />
                      Restore from File
                      <input type="file" accept=".json" onChange={handleImportUniverse} style={{ display: 'none' }} />
                    </label>
                  </div>

                  <div className="action-buttons-row" style={{ marginTop: 24 }}>
                    <button className="btn-save" style={{ background: '#0a84ff' }} onClick={exportTrainingData}>
                      Export Sketches (ڈرائنگ محفوظ کریں)
                    </button>
                    <div className="btn-delete" style={{ background: '#333', position: 'relative' }}>
                      Import Sketches (ڈرائنگ لائیں)
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={importTrainingData} 
                        style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gestures Settings */}
            {activeTab === 'gestures' && (
              <div className="gestures-settings-container">
                <p className="settings-hint">
                  Customize what happens when Naani makes a gesture.
                  <br/><i>جب نانی اشارہ کریں تو کیا ہونا چاہیے؟ یہاں منتخب کریں۔</i>
                </p>
                <div className="list-group">
                  {Object.entries(GESTURE_LABELS).map(([key, labels]) => (
                    <div key={key} className="list-item massive-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{labels.en} / {labels.ur}</span>
                      </div>
                      <select 
                        className="massive-input"
                        value={gestureMappings[key] || ''}
                        onChange={(e) => handleGestureChange(key, e.target.value)}
                      >
                        {GESTURE_ACTIONS.map(action => (
                          <option key={action.value} value={action.value}>
                            {action.en} ({action.ur})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit Form */}
        {editingItem && (
          <div className="edit-form simple-form">
            <WordEditor 
              item={editingItem} 
              isNew={editMode === 'new'}
              onChange={(newItem) => setEditingItem({ ...editingItem, ...newItem })} 
              onSave={handleSave}
              onDelete={handleDelete}
            />

            {editingType === 'quote' && (
              <div className="form-group large-group" style={{ marginTop: '-20px', marginBottom: '20px' }}>
                <label>Source (حوالہ)</label>
                <input 
                  type="text" className="massive-input" 
                  value={editingItem.source} 
                  onChange={e => setEditingItem({...editingItem, source: e.target.value})} 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
