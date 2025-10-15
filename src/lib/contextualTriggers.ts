import Fuse from 'fuse.js';

/**
 * Extensive Contextual Triggers for Shukr Ambient Listener
 * Maps common heard phrases (Urdu Script, Roman Urdu, and English)
 * to relevant response word IDs from phrases.json.
 */

export interface ContextTrigger {
  heard: string[];
  suggest: string[]; // Word IDs from phrases.json
}

export const CONTEXTUAL_TRIGGERS: ContextTrigger[] = [
  // --- Social Greetings & Wellness ---
  {
    heard: [
      'kaise ho', 'how are you', 'kaise hain', 'aap kaise hain',
      'آپ کیسے ہیں', 'کیسی ہو', 'کیا حال ہے', 'kya haal hai', 'tabiyat'
    ],
    suggest: ['alhamdulillah', 'theek', 'hun', 'shukr', 'haan']
  },
  {
    heard: [
      'assalamualaikum', 'salam', 'hello', 'namaste',
      'سلام', 'اسلام علیکم', 'dua salam'
    ],
    suggest: ['shukriya', 'kaise', 'aap', 'theek', 'alhamdulillah']
  },

  // --- Shingles, Skin & Pain Management (Highly Specific) ---
  {
    heard: [
      'kya hua', 'what happened', 'kahan dard hai', 'where does it hurt',
      'shingles', 'rash', 'blisters', 'dard', 'takleef',
      'کیا ہوا', 'کہاں درد ہے', 'تکلیف', 'takleef'
    ],
    suggest: ['shingles', 'jalan', 'khujli', 'daane', 'tez_dard', 'malham']
  },
  {
    heard: [
      'itching', 'khujli', 'burning', 'jalan', 'sojan', 'sujan',
      'خارش', 'جلن', 'سوجن', 'khaj'
    ],
    suggest: ['malham', 'thandak', 'chahiye', 'dedo', 'lotion']
  },
  {
    heard: [
      'laali', 'surkhi', 'redness', 'red', 'cream', 'malham', 'lagana', 'rash',
      'سرخی', 'لال', 'کریم', 'مرہم', 'shingles', 'shingle'
    ],
    suggest: ['malham', 'cream_core', 'thandak', 'chahiye', 'dedo', 'jalan']
  },
  {
    heard: [
      'jalan', 'burning', 'fire', 'sharp pain', 'tez dard',
      'جلن', 'تیز درد', 'آگ'
    ],
    suggest: ['malham', 'thandak', 'lotion', 'chahiye']
  },
  {
    heard: [
      'pitt', 'pitti', 'rash', 'daane', 'red spots',
      'پت', 'دانے', 'سرخ'
    ],
    suggest: ['shingles', 'malham', 'thandak', 'jalan']
  },

  // --- Medicine & Health Checks ---
  {
    heard: [
      'dawaii li', 'medicine', 'did you take medicine', 'panadol', 'betaserk', 'goli', 'tablet',
      'دوائی', 'گولی', 'پیناڈول'
    ],
    suggest: ['leli', 'haan', 'nahi', 'dedo', 'shukriya']
  },
  {
    heard: [
      'chakkar', 'dizzy', 'faint', 'kamzori', 'sar ghoom raha',
      'چکر', 'کمزوری', 'سر گھومنا'
    ],
    suggest: ['betaserk', 'hun', 'nahi', 'chahiye', 'araam']
  },
  {
    heard: [
      'blood pressure', 'bp', 'sugar', 'checkup',
      'بی پی', 'شوگر'
    ],
    suggest: ['theek', 'check', 'karo', 'haan', 'shukr']
  },

  // --- Basic Needs (Food/Water) ---
  {
    heard: [
      'khana', 'food', 'lunch', 'dinner', 'breakfast', 'nashta', 'bhook', 'bhuk', 'roti', 'salan',
      'کھانا', 'ناشتہ', 'بھوک', 'روٹی'
    ],
    suggest: ['bhuk', 'nahi', 'haan', 'acha', 'shukriya', 'khana_core']
  },
  {
    heard: [
      'pani', 'water', 'pyas', 'thirsty', 'drink', 'glass',
      'پانی', 'پیاس', 'گلاس'
    ],
    suggest: ['chahiye', 'dedo', 'shukriya', 'nahi', 'pani_core']
  },
  {
    heard: [
      'chai', 'tea', 'doodh', 'milk', 'juice',
      'چائے', 'دودھ', 'جوس'
    ],
    suggest: ['chahiye', 'pini', 'shakar', 'fika', 'acha']
  },

  // --- Hygiene & Comfort ---
  {
    heard: [
      'washroom', 'toilet', 'bathroom', 'peshab', 'pakhana',
      'واش روم', 'ٹائلٹ'
    ],
    suggest: ['chahiye', 'jana', 'lelo', 'haan', 'nahi']
  },
  {
    heard: [
      'nahaana', 'bath', 'shower', 'saaf', 'clean', 'change', 'kapde',
      'نہانا', 'کپڑے'
    ],
    suggest: ['haan', 'nahi', 'baad', 'mein', 'acha']
  },

  // --- Environment (Dementia Specific) ---
  {
    heard: [
      'garmi', 'pankha', 'fan', 'hot', 'sweating', 'ac',
      'گرمی', 'پنکھا'
    ],
    suggest: ['pankha', 'chahiye', 'haan', 'theek', 'chalao']
  },
  {
    heard: [
      'takiya', 'kambal', 'pillow', 'blanket', 'cold', 'thand', 'razai',
      'تکیہ', 'کمبل', 'تھنڈ'
    ],
    suggest: ['takiya', 'kambal', 'chahiye', 'dedo', 'theek']
  },
  {
    heard: [
      'light', 'andhera', 'dark', 'bijli',
      'روشنی', 'اندھیرا'
    ],
    suggest: ['chalao', 'band', 'karo', 'theek', 'dar']
  },

  // --- Spiritual / Zikr ---
  {
    heard: [
      'dua', 'pray', 'namaz', 'zikr', 'allah', 'quran', 'tasbeeh',
      'دعا', 'نماز', 'تسبیح', 'قرآن'
    ],
    suggest: ['allah', 'shukr', 'alhamdulillah', 'inshallah', 'mashallah', 'subhanallah']
  },
  {
    heard: [
      'wuzu', 'wudhu', 'clean',
      'وضو'
    ],
    suggest: ['karna', 'hai', 'haan', 'nahi', 'acha']
  },

  // --- Family & People ---
  {
    heard: [
      'hammaad', 'betay', 'grandson', 'beta',
      'حماد', 'بیٹا'
    ],
    suggest: ['idhar', 'aao', 'pyar', 'dua', 'theek']
  },
  {
    heard: [
      'bachay', 'children', 'kids', 'ghar wale',
      'بچے', 'گھر'
    ],
    suggest: ['kaise', 'hain', 'acha', 'shukr', 'dua']
  }
];

/**
 * Finds the best matching trigger for a given transcript.
 * Uses Fuzzy matching to handle variations in speech.
 */
export const findMatchingTrigger = (transcript: string): ContextTrigger | null => {
  if (!transcript || transcript.length < 2) return null;
  const normalized = transcript.toLowerCase().trim();
  
  // 1. First try exact/inclusion match (fast & reliable for short phrases)
  const quickMatch = CONTEXTUAL_TRIGGERS.find(trigger => 
    trigger.heard.some(phrase => normalized.includes(phrase.toLowerCase()))
  );
  if (quickMatch) return quickMatch;

  // 2. Fallback to Fuzzy Search for more complex ambient speech
  const fuse = new Fuse(CONTEXTUAL_TRIGGERS, {
    keys: ['heard'],
    threshold: 0.4, // Balanced sensitivity
    includeScore: true
  });

  const fuzzyResults = fuse.search(normalized);
  if (fuzzyResults.length > 0) {
    return fuzzyResults[0].item;
  }

  return null;
};
