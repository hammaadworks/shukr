# Language Management & Localization

Shukr is a global platform supporting a wide range of languages, scripts, and cultural contexts. This guide explains how to manage existing languages and add new ones to the "Universe."

---

## 🌍 Supported Languages
Shukr currently supports the following locales out-of-the-box:
*   **Urdu (ur)** - Native RTL support with Nastaliq fonts.
*   **English (en)**
*   **Spanish (es)**
*   **Arabic (ar)** - Native RTL support.
*   **Hindi (hi)**
*   **Chinese (zh)**
*   **French (fr)**

---

## 🛠️ Adding a New Language

### 1. Update Core Vocabulary
**File:** `src/lib/data/core/vocabulary.json`
Add the new language code to the `translations` and `transliterations` objects for every word. 
*Example for Spanish (es):*
```json
"translations": {
  "en": "Water",
  "ur": "پانی",
  "es": "Agua"
}
```

### 2. Register in UI Constants
**File:** `src/hooks/useLanguage.tsx`
Add the language to the `SUPPORTED_LANGS` array:
```typescript
{ code: 'es', label: 'Spanish (Español)' }
```

### 3. Layout Configuration (RTL/LTR)
**File:** `src/hooks/useLanguage.tsx`
If the language is Right-to-Left (e.g., Farsi, Hebrew), add its code to the `rtlLangs` array within the `getDirection` helper.

---

## 🤖 AI-Assisted Localization

We recommend using the **Word Manager** (available at `#words`) to bulk-translate or fix metadata for new languages.
1.  Configure your **AI Endpoint** in the Word Manager settings.
2.  Use the **"Ask AI to Fix"** feature on any word. The generalized AI provider will respect the multilingual schema and provide translations for all configured languages.

---

## 📂 Architecture Summary

| Component | Responsibility |
| :--- | :--- |
| `useLanguage.tsx` | Global i18n state, direction (RTL/LTR) management. |
| `dataAssembler.ts` | Dynamically maps vocabulary to the active primary/secondary pair. |
| `vocabulary.json` | The single source of truth for all multilingual strings. |
| `translator.ts` | Performs O(1) lookups for word and category labels. |
