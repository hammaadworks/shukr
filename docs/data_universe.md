# Data Universe Architecture: A Deep Dive

The **Data Universe** is the core foundational architecture of Shukr. It manages all persistent storage, cross-device synchronization, offline capabilities, and localization string mapping. This document provides a deep dive into the schemas, data flows, and technical decisions that make Shukr robust, private, and fully functional offline.

---

## 1. The Core Philosophy

Shukr operates as a strictly **offline-first Progressive Web App (PWA)**. 

**The Problem Solved:** 
Vulnerable seniors need communication tools that are *instantly* available, regardless of internet connectivity. They also need absolute privacy; their personal voice recordings, daily habits, and custom family names should never leave their device.

**The Solution:**
All critical user data, ranging from basic settings to machine learning templates, is stored entirely on the local device using **IndexedDB**, wrapped by the `Dexie` library for clean, strongly-typed asynchronous transactions.

---

## 2. Logical Domains & Schema Deep Dive

The Data Universe is logically divided into three primary databases, each handling a specific type of data payload.

### A. Word Universe (`universeDb.ts`)
This is the primary relational store for the app's vocabulary, UI structure, and the predictive machine learning graph.

**Table: `words`**
*Role:* Stores every piece of communicable vocabulary in the app (words, phrases, alphabets, etc.).
*Schema:*
- `id` (String, Primary Key): Unique identifier (e.g., `apple`, `sukun`).
- `icon` (String): String mapping to a Lucide React icon.
- `type` (String, Indexed): Discriminator (`word`, `phrase`, `number`, `alphabet`, `contact`).
- `usageCount` (Number, Indexed): Total times this word has been spoken.
- `lastUsedAt` (Number, Indexed): Epoch timestamp. Used for recency bias in predictions.
- `timeBias` (Array of Numbers): Hours of the day (0-23) when this word is highly relevant.
- `next` (Array of Strings): Edge nodes for the Prediction Graph. Contains IDs of words that typically follow this one.
- `transitions` (Object): Map of string IDs to integers, tracking detailed Markov-chain transition frequencies.
- `tags` (Array of Strings): Used for advanced filtering.

> **Note:** Localization strings (like `en` and `ur`) are **NOT** stored structurally inside `universeDb.words`. Instead, the ID is resolved through the `TranslatorService` which maps the ID to strings located in `src/lib/data/i18n/*.json`.

**Table: `categories`**
*Role:* Defines the high-level folders and structural navigation of the app.
*Schema:*
- `id` (String, Primary Key): e.g., `food`, `general`.
- `label_en` / `label_ur` (String): Display names.
- `icon` (String): Lucide React icon mapping.
- `order` (Number, Indexed): Controls the sort order of the category sliders in the UI.

**Table: `quotes` (Added in v2)**
*Role:* Stores motivational phrases and quotes that appear in the UI to encourage the user.
*Schema:*
- `id` (String, Primary Key): Unique identifier.
- `source` (String): Where the quote came from (e.g., Quran, Hadith, Custom).
- `createdAt` (Number, Indexed): Timestamp of creation.

### B. Audio Storage (`audioStorage.ts`)
*Role:* Handles all custom voice recordings generated in the Voice Studio. 
*The Solution:* We use a raw `IDBPDatabase` wrapper (via `idb`) specifically to store native `Blob` objects directly.

*Schema (Object Store: `audio_blobs`):*
- `id` (String, Primary Key): A composite cache key formatted as `${profileId}_${wordId}_${language}`.
- `blob` (Blob): The raw `.wav` or `.webm` audio buffer.
- `timestamp` (Number): Used for cache invalidation.

### C. Recognition Database (`db.ts`)
*Role:* Manages the custom-trained user sketches and doodle strokes for the local Machine Learning engine.
*Schema (Table: `templates`):*
- `id` (String, Auto-incremented Primary Key): Unique ID.
- `wordId` (String, Indexed): The vocabulary word this sketch translates to.
- `strokes` (Array of Arrays): The raw mathematical vector data `[{x, y, t}, ...]` representing the user's drawing path.

---

## 3. Adding Words Manually (For Developers)

To dramatically reduce the "touch vector" of adding a single word, Shukr ships with a CLI utility that updates all core architecture files instantly.

### Using the `add-word` Script

If you want to add a word to the default distribution of the app (the "Boot Data"), run the following command from the root of the project:

```bash
node scripts/add-word.cjs --id=word_id --en="English Text" --ur="Urdu Text" --es="Spanish Text" --ar="Arabic Text" --icon=icon_name
```

**Parameters:**
| Name | Required | Description |
|------|----------|-------------|
| `--id` | Yes | Unique string identifier (e.g., `apple`, `pray`). |
| `--en` | Yes | English localization. |
| `--ur` | No | Urdu localization (falls back to English if missing). |
| `--es` | No | Spanish localization. |
| `--ar` | No | Arabic localization. |
| `--icon`| No | The Lucide React icon name (e.g., `smile`, `heart`). Defaults to `star`. |
| `--isFamily`| No | Set to `true` to automatically place this word inside the Family footer group. |

**What this script does:**
1. Injects structural metadata into `src/lib/data/core/vocabulary.json`.
2. Registers the word ID inside the `settings.json` family array (if `--isFamily=true`).
3. Maps all localizations cleanly across `src/lib/data/i18n/en.json`, `ur.json`, `es.json`, and `ar.json`.

---

## 4. Language Management & Localization

Shukr handles i18n using an **O(1) memory mapping architecture**.

### Adding a Completely New Language

1. **Create the Translation Pack:**
   Create a new file `src/lib/data/i18n/[code].json` (e.g., `bn.json` for Bengali). Copy the structure from `en.json`.
2. **Translate:** Fill in the values for `categories`, `words`, and `quotes`.
3. **Add Transliterations (Optional):** 
   You can add an object called `transliterations` mapping how your language's words sound phonetically to English/Spanish readers.
4. **Register the Locale:**
   In `src/components/SettingsPanel.tsx`, add `{ code: 'bn', label: 'Bengali (বাংলা)' }` to the `SUPPORTED_LANGS` constant.
5. **Configure LTR/RTL:**
   In `src/hooks/useLanguage.tsx`, if the language reads right-to-left, add its code to the `rtlLangs` array.
6. **Register in Translator:**
   In `src/lib/translator.ts`, import `bnData from './data/i18n/bn.json'` and attach it to the `STATIC_I18N` record mapping.

---

## 5. Synchronization & Data Portability

Because all data is inherently local, users need a seamless way to backup, share, or move their data to a new device. The **Universe Porter** handles exporting the *entire* IndexedDB state into a single portable JSON snapshot.

### Exporting & Importing the Universe
When a user clicks "Backup Universe":
1. Reads all words, categories, sketches, and quotes from IndexedDB.
2. Iterates over all custom audio `Blob`s and converts them into serialized `Base64` strings (Data URLs).
3. Bundles everything with the current app configuration.
4. Downloads a comprehensive `.json` file directly to the user's device.

Upon import, `UniversePorter` safely merges the snapshot:
* Audio is restored natively from Base64 into Blobs.
* `bulkPut` operations merge the imported arrays, ensuring new IDs are created and overlapping IDs are updated.

### Hard Deleting Data
Users have the ultimate right to wipe their slate clean via "Reset Advanced Settings".
If a developer needs to trigger a full wipe programmatically:
```typescript
import { universePorter } from '../lib/universePorter';

// This completely destroys the IndexedDB and purges all custom words and voices.
// It will force a hard reload of the application.
await universePorter.hardReset();
```
