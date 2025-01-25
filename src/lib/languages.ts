export const SUPPORTED_LANGS = [
  { code: 'ur', label: 'Urdu (اردو)' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'zh', label: 'Chinese (中文)' },
  { code: 'fr', label: 'French (Français)' }
];

export const getLanguageCodes = () => SUPPORTED_LANGS.map(l => l.code);
export const getLanguageLabel = (code: string) => SUPPORTED_LANGS.find(l => l.code === code)?.label || code;

export const GEOMETRIC_CORES = ['circle', 'square', 'triangle', 'wave', 'zigzag'];
export const STRUCTURAL_DESCRIPTORS = ['outline', 'stroke', 'compact'];
export const ALL_DOODLE_SHAPES = [...GEOMETRIC_CORES, ...STRUCTURAL_DESCRIPTORS];
