# Customizing Shukr

Shukr is designed to be highly tailorable. Whether you're a caregiver personalizing the grid or a developer setting up a regional deployment, this guide covers all levels of customization.

---

## 🛠️ In-App Customization

### Word Manager & Editor
The **Word Manager** (accessible via `#words`) is the primary interface for managing your dictionary.
1.  **Add/Edit Words:** Modify translations for all supported languages.
2.  **Verify Content:** Mark words as "Verified" once you are happy with their metadata.
3.  **AI Assistant:** Connect your preferred AI model to automatically fix spellings or generate translations.

### Voice Studio
Personalize any word by recording a familiar voice.
1.  Open **Settings > Voice Studio**.
2.  Select a word and record. Recordings are stored locally for privacy.
3.  IDs follow the standard `language_voice_voicename` format for consistency.

---

## 📂 Configuration as Code (`vocabulary.json`)

Developers can seed the application with custom data by modifying `src/lib/data/core/vocabulary.json`.

**Example Entry:**
```json
{
  "id": "water",
  "icon": "droplet",
  "translations": {
    "en": "Water",
    "ur": "پانی",
    "es": "Agua",
    "ar": "ماء"
  }
}
```

---

## 🤖 Generalized AI Configuration

Shukr can connect to any AI provider (local or cloud) to assist with vocabulary management. 

### Configuration (Word Manager)
- **Endpoint:** The full API URL (e.g., Gemini, OpenAI, or local Ollama).
- **API Key:** Your authentication token.
- **Auth Type:** Supports `None` (for local models), `Bearer`, or `Basic`.

---

## 🌍 Global Localization

Shukr is **Multilingual-first**. To add support for a new script or language:
1.  Add the language code to `SUPPORTED_LANGS` in `src/hooks/useLanguage.tsx`.
2.  Populate the `translations` object in `vocabulary.json`.
3.  Use the **Universe Porter** to share your localized configuration with others.
