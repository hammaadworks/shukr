import type { AppConfig } from '../hooks/useAppConfig';
import { SUPPORTED_LANGS } from './languages';

export interface AISuggestion {
  translations: Record<string, string>;
  transliterations: Record<string, Record<string, string>>;
  doodle_shapes: string[];
}

export const aiProvider = {
  async getSuggestion(wordOrText: any, config: AppConfig): Promise<AISuggestion | null> {
    const aiConfig = config.ai_config;
    if (!aiConfig || !aiConfig.endpoint) {
      throw new Error('AI Provider not configured. Please set endpoint and API key in settings.');
    }

    const langCodes = SUPPORTED_LANGS.map(l => l.code);
    const langLabels = SUPPORTED_LANGS.map(l => `${l.label} (${l.code})`).join(', ');

    const isObject = typeof wordOrText === 'object';
    const inputJson = isObject ? JSON.stringify(wordOrText, null, 2) : wordOrText;

    const prompt = `
      You are an expert linguist and visual designer for an AAC (Augmentative and Alternative Communication) app.
      Your task is to provide high-quality translations, precise transliterations, and doodle classification for the following supported languages:
      ${langLabels}

      ---
      1. TRANSLATION RULES:
      - Semantic Consistency: Ensure the concept is identical across all languages.
      - Usage: Use common, conversational words suitable for daily communication.

      ---
      2. TRANSLITERATION RULES (Critical):
      - Phonetic Accuracy: Prioritize how the word SOUNDS in the target script, not how it is spelled.
      - Mapping: Provide a nested map where transliterations[source_lang][target_lang] is the phonetic pronunciation of the source_lang word written in the target_lang's script.
      - Generation Logic: For each language pair (source -> target), mentally vocalize the word in the source language and then write that exact sound using the characters and phonetics of the target language.
      - Examples: 
        * Urdu -> English: "tokri" (Roman Urdu).
        * English -> Urdu: "باسکٹ" (Phonetic English in Urdu script).

      ---
      3. DOODLE SHAPES RULES (Mandatory Selection):
      Assign shapes that represent the VISUAL CONCEPT of the word. Choose 2-3 tags from the following list ONLY:

      Geometric Core (Native Templates):
      - circle: Round items (Apple, Face, Clock, Plate).
      - square: Boxy items (Book, Quran, Phone, Tablet).
      - triangle: Pointy items (Samosa, Direction, Carrot).
      - wave: Flowing items (Water, Juice, Dua, Praying).
      - zigzag: Sharp/Urgent (Pain, Fever, Danger).

      Structural Descriptors:
      - outline: Hollow shapes or borders.
      - stroke: Simple lines or single-path drawings.
      - compact: Small, dense drawings.

      Note: Using these alongside a geometric core (e.g., ["circle", "outline"]) improves accuracy.

      ---
      GOOD EXAMPLE:
      Input: "basket"
      Response: {
        "translations": {
          "en": "Basket", "es": "Canasta", "ur": "ٹوکری", "ar": "سلة", "hi": "टोकरी", "zh": "篮子", "fr": "Panier"
        },
        "transliterations": {
          "en": { "es": "basket", "ur": "باسکٹ", "ar": "باسكيت", "hi": "बास्केट", "zh": "巴斯克特", "fr": "basket" },
          "es": { "en": "canasta", "ur": "کاناستا", "ar": "كاناستا", "hi": "कनास्ता", "zh": "卡纳斯塔", "fr": "canasta" },
          "ur": { "en": "tokri", "es": "tokri", "ar": "ٹوكري", "hi": "टोकरी", "zh": "托克里", "fr": "tokri" },
          "ar": { "en": "salla", "es": "salla", "ur": "سلا", "hi": "सल्ला", "zh": "萨拉", "fr": "salla" },
          "hi": { "en": "tokri", "es": "tokri", "ur": "ٹوکری", "ar": "तोकरी", "zh": "托克里", "fr": "tokri" },
          "zh": { "en": "lanzi", "es": "lanzi", "ur": "لانزی", "ar": "لانزي", "hi": "लान्ज़ी", "fr": "lanzi" },
          "fr": { "en": "panier", "es": "panier", "ur": "پانیے", "ar": "بانييه", "hi": "पानिये", "zh": "帕尼耶" }
        },
        "doodle_shapes": ["square", "outline"]
      }

      ---
      Input to process: ${inputJson}

      Respond ONLY with a JSON object matching this schema:
      {
        "translations": { ${langCodes.map(c => `"${c}": "..."`).join(', ')} },
        "transliterations": {
          ${langCodes.map(src => `"${src}": { ${langCodes.filter(t => t !== src).map(t => `"${t}": "..."`).join(', ')} }`).join(',\n          ')}
        },
        "doodle_shapes": ["geometric_core", "structural_descriptor"]
      }
    `;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (aiConfig.authType === 'bearer' && aiConfig.apiKey) {
        headers['Authorization'] = `Bearer ${aiConfig.apiKey}`;
      } else if (aiConfig.authType === 'basic' && aiConfig.username && aiConfig.password) {
        headers['Authorization'] = `Basic ${btoa(`${aiConfig.username}:${aiConfig.password}`)}`;
      }

      const isGemini = aiConfig.endpoint.includes('generativelanguage.googleapis.com');
      const url = isGemini && aiConfig.apiKey ? `${aiConfig.endpoint}?key=${aiConfig.apiKey}` : aiConfig.endpoint;

      let body: any;
      if (isGemini) {
        body = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        };
      } else {
        body = {
          model: aiConfig.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" },
          prompt: prompt,
          stream: false,
          format: 'json'
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI request failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      let text = '';

      if (isGemini) {
        text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else if (data.choices?.[0]?.message?.content) {
        text = data.choices[0].message.content;
      } else if (data.response) {
        text = data.response;
      } else if (data.message?.content) {
        text = data.message.content;
      } else {
        text = JSON.stringify(data);
      }

      if (!text) return null;
      
      const cleanedText = text.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error('AI call failed', e);
      return null;
    }
  }
};
