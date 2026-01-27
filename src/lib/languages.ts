export const SUPPORTED_LANGS =
    [
        {code: 'ar', label: 'Arabic (العربية)'},
        {code: 'en', label: 'English'},
        {code: 'ur', label: 'Urdu (اردو)'},
        {code: 'hi', label: 'Hindi (हिन्दी)'},
        {code: 'es', label: 'Spanish (Español)'},
        {code: 'fr', label: 'French (Français)'},
        {code: 'zh', label: 'Chinese (中文)'}
    ];

export const getLanguageCodes = () => SUPPORTED_LANGS.map(l => l.code);
export const getLanguageLabel = (code: string) => SUPPORTED_LANGS.find(l => l.code === code)?.label || code;
