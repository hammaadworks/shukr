import re

with open("src/components/WordManager.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace("Settings, Save } from 'lucide-react';", "Settings, Save, Languages } from 'lucide-react';\nimport { WordCard } from './WordCard';")

# 2. Add states to WordManager
state_hook_injection = """  const [editableWord, setEditableWord] = useState<WordUniverseItem | null>(null);

  const [activeTabLang, setActiveTabLang] = useState('en');
  const [helperLang, setHelperLang] = useState('ur');"""
content = content.replace("  const [editableWord, setEditableWord] = useState<WordUniverseItem | null>(null);", state_hook_injection)

# 3. Header replacement
old_header = """        <div style={{ textAlign: 'center', flex: 1 }}>
          <h2 style={{ margin: 0 }}>Word Manager</h2>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {verifiedCount} / {words.length} Verified
          </div>
        </div>
        <button className="btn-icon large-icon" onClick={() => setShowAiConfig(!showAiConfig)}>"""

new_header = """        <div style={{ textAlign: 'center', flex: 1 }}>
          <h2 style={{ margin: 0 }}>Word Manager</h2>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {verifiedCount} / {words.length} Verified
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: 12 }}>
            <select 
              value={helperLang} 
              onChange={e => setHelperLang(e.target.value)}
              style={{
                appearance: 'none', background: 'transparent', border: 'none', color: 'var(--color-primary)', 
                fontWeight: 700, fontSize: '0.9rem', paddingRight: 20, cursor: 'pointer', outline: 'none'
              }}
            >
              {SUPPORTED_LANGS.map(l => <option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>)}
            </select>
            <Languages size={16} color="var(--color-primary)" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        <button className="btn-icon large-icon" onClick={() => setShowAiConfig(!showAiConfig)}>"""
content = content.replace(old_header, new_header)

# 4. requestTabAiFix method
tab_ai_fix_method = """
  const requestTabAiFix = async (lang: string) => {
    if (!editableWord || !config || editableWord.verified) return;
    setIsAiLoading(true);
    setError(null);
    try {
      const baseWord = editableWord.translations?.['en'] || editableWord.id;
      const suggestion = await aiProvider.getSingleLanguageSuggestion(baseWord, lang, config);
      if (suggestion) {
        const updatedWord: WordUniverseItem = {
          ...editableWord,
          translations: {
            ...(editableWord.translations || {}),
            [lang]: suggestion.translation
          },
          transliterations: {
            ...(editableWord.transliterations || {}),
            [lang]: {
               ...(editableWord.transliterations?.[lang] || {}),
               ...(suggestion.transliterations || {})
            }
          }
        };
        if (lang === 'ur') updatedWord.ur = suggestion.translation;
        if (lang === 'en') updatedWord.en = suggestion.translation;
        if (lang === 'ur' && suggestion.transliterations && suggestion.transliterations['en']) updatedWord.roman = suggestion.transliterations['en'];

        setEditableWord(updatedWord);
      }
    } catch (e: any) {
      setError(e.message || 'Tab AI fix failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  const addNewWord = async () => {"""
content = content.replace("  const addNewWord = async () => {", tab_ai_fix_method)

# 5. Refactor the editableWord rendering block
start_idx = content.find("              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>")
end_idx = content.find("                <div>\\n                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 12 }}>DOODLE SHAPES</label>")

if end_idx == -1:
    end_idx = content.find("                <div>\\n                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 12 }}>DOODLE SHAPES</label>".replace("\\n", "\n"))

if start_idx != -1 and end_idx != -1:
    new_render_block = """              {/* Word Card Preview */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                 <div style={{ width: '100%', maxWidth: 400 }}>
                   <WordCard 
                      item={editableWord} 
                      isFocused={false} 
                      onClick={() => {}} 
                      variant={1}
                      forceDualMode={true}
                      languageOverride={activeTabLang}
                      helperLanguageOverride={helperLang}
                   />
                 </div>
              </div>

              {/* Language Tabs */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #eee', scrollbarWidth: 'none' }}>
                {SUPPORTED_LANGS.map(lang => (
                   <button
                     key={lang.code}
                     onClick={() => setActiveTabLang(lang.code)}
                     style={{
                       padding: '8px 16px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                       background: activeTabLang === lang.code ? 'var(--color-primary)' : '#f2f2f7',
                       color: activeTabLang === lang.code ? 'white' : '#8e8e93',
                       cursor: 'pointer'
                     }}
                   >
                     {lang.label} ({lang.code.toUpperCase()})
                   </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ paddingBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                          {SUPPORTED_LANGS.find(l => l.code === activeTabLang)?.label} Translation
                        </label>
                        <button 
                          onClick={() => requestTabAiFix(activeTabLang)}
                          disabled={isAiLoading || editableWord.verified}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(45, 90, 39, 0.1)', 
                            color: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '4px 8px', 
                            fontSize: '0.7rem', fontWeight: 800, opacity: isAiLoading || editableWord.verified ? 0.5 : 1,
                            cursor: 'pointer'
                          }}
                        >
                          {isAiLoading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />} Tab AI Fix
                        </button>
                      </div>
                      <input 
                         className="massive-input"
                         style={{ 
                           width: '100%', height: 60, fontSize: activeTabLang === 'ur' || activeTabLang === 'ar' ? '2rem' : '1.3rem', 
                           fontFamily: activeTabLang === 'ur' || activeTabLang === 'ar' ? 'var(--font-ur)' : 'inherit',
                           fontWeight: 800, background: '#f9f9f9', border: '1px solid #eee', borderRadius: 12, padding: '0 16px'
                         }}
                         value={editableWord.translations?.[activeTabLang] || ''}
                         onChange={e => updateWordTranslation(activeTabLang, e.target.value)}
                         disabled={editableWord.verified}
                      />

                      <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                          Pronunciation Guides (Transliterations)
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {SUPPORTED_LANGS.filter(t => t.code !== activeTabLang).map(target => {
                             const currentVal = editableWord.transliterations?.[activeTabLang]?.[target.code] || '';
                             const shouldShow = target.code === 'en' || target.code === 'ur' || currentVal;
                             if (!shouldShow) return null;

                             return (
                               <div key={target.code} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                 <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#aaa', minWidth: 60 }}>IN {target.code.toUpperCase()}</span>
                                 <input 
                                   style={{ flex: 1, height: 32, fontSize: '0.85rem', borderRadius: 8, border: '1px solid #eee', padding: '0 8px' }}
                                   placeholder={`Phonetic ${activeTabLang} in ${target.label}`}
                                   value={currentVal}
                                   onChange={e => updateWordTransliteration(activeTabLang, target.code, e.target.value)}
                                   disabled={editableWord.verified}
                                 />
                               </div>
                             );
                          })}
                        </div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                          Voices
                        </label>
                        <VoiceAudioItem wordId={editableWord.id} voice={{ id: 'default', name: 'System Default' }} lang={activeTabLang} onRecord={onRecord} />
                        {(config?.voices || []).map((voice: any) => (
                          <VoiceAudioItem key={`${voice.id}_${activeTabLang}`} wordId={editableWord.id} voice={voice} lang={activeTabLang} onRecord={onRecord} />
                        ))}
                      </div>
                  </div>

"""
    content = content[:start_idx] + new_render_block + content[end_idx:]
else:
    print("Could not find blocks")
    print(start_idx, end_idx)

with open("src/components/WordManager.tsx", "w", encoding="utf-8") as f:
    f.write(content)

