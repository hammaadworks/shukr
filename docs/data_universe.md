# Data Universe Architecture: A Deep Dive

The **Data Universe** is the core foundational architecture of Shukr. It manages all persistent storage, cross-device synchronization, and offline capabilities. This document provides a deep dive into the schemas, data flows, and technical decisions that make Shukr robust, private, and fully functional offline.

---

## 1. The Core Philosophy

Shukr operates as a strictly **offline-first Progressive Web App (PWA)**. 

**The Problem Solved:** 
Vulnerable seniors, particularly those with speech loss or cognitive impairments, need communication tools that are *instantly* available, regardless of internet connectivity. They also need absolute privacy; their personal voice recordings, daily habits, and custom family names should never leave their device unless explicitly requested.

**The Solution:**
All critical user data, ranging from basic settings to machine learning templates, is stored entirely on the local device using **IndexedDB**. We wrap IndexedDB with the `Dexie` library to guarantee clean, strongly-typed asynchronous transactions, robust indexing, and excellent browser compatibility.

---

## 2. Logical Domains & Schema Deep Dive

The Data Universe is logically divided into three primary databases, each handling a specific type of data payload.

### A. Word Universe (`universeDb.ts`)
This is the primary relational store for the app's vocabulary, UI structure, and the predictive machine learning graph.

**Table: `words`**
*Role:* Stores every piece of communicable vocabulary in the app (words, phrases, alphabets, etc.).
*Schema:*
- `id` (String, Primary Key): Unique identifier (e.g., `gold`, `sukun`). Derived from English or Roman text.
- `en` (String, Indexed): The English display text and search key.
- `ur` (String): The Urdu translation.
- `roman` (String, Optional): Roman Urdu transliteration for easier reading by non-native speakers.
- `category` (String, Indexed): Foreign key linking to the `categories` table.
- `icon` (String): String mapping to a Lucide React icon.
- `type` (String, Indexed): Discriminator (`word`, `phrase`, `number`, `alphabet`, `contact`).
- `usageCount` (Number, Indexed): Total times this word has been spoken.
- `lastUsedAt` (Number, Indexed): Epoch timestamp. Used for recency bias in predictions.
- `timeBias` (Array of Numbers): Hours of the day (0-23) when this word is highly relevant (e.g., `[7, 8, 9]` for Breakfast).
- `next` (Array of Strings): Edge nodes for the Prediction Graph. Contains IDs of words that typically follow this one.
- `tags` (Array of Strings): Used for advanced filtering.

**Table: `categories`**
*Role:* Defines the high-level folders and structural navigation of the app.
*Schema:*
- `id` (String, Primary Key): e.g., `food`, `family`.
- `label_en` / `label_ur` (String): Display names.
- `icon` (String): Lucide React icon mapping.
- `order` (Number, Indexed): Controls the sort order of the category sliders in the UI.

**Table: `quotes` (Added in v2)**
*Role:* Stores motivational phrases and quotes that appear in the UI to encourage the user.
*Schema:*
- `id` (String, Primary Key): Unique identifier.
- `en` / `ur` (String): The text of the motivation.
- `source` (String): Where the quote came from (e.g., Quran, Hadith, Custom).
- `createdAt` (Number, Indexed): Timestamp of creation.

### B. Audio Storage (`audioStorage.ts`)
*Role:* Handles all custom voice recordings generated in the Voice Studio. 
*The Problem:* Audio files are binary data. Storing them as Base64 strings in a standard database is highly inefficient and causes severe memory bloat.
*The Solution:* We use a raw `IDBPDatabase` wrapper (via `idb`) specifically to store native `Blob` objects directly.

*Schema (Object Store: `audio_blobs`):*
- `id` (String, Primary Key): A composite cache key formatted as `${profileId}_${wordId}_${language}`.
- `blob` (Blob): The raw `.wav` or `.webm` audio buffer.
- `timestamp` (Number): Used for cache invalidation.

### C. Recognition Database (`db.ts`)
*Role:* Manages the custom-trained user sketches and doodle strokes for the local Machine Learning engine (k-NN).
*Schema (Table: `templates`):*
- `id` (String, Auto-incremented Primary Key): Unique ID.
- `wordId` (String, Indexed): The vocabulary word this sketch translates to.
- `category` (String, Indexed): Recognition mode (`numbers`, `needs`, `custom`, etc.).
- `strokes` (Array of Arrays): The raw mathematical vector data `[{x, y, t}, ...]` representing the user's drawing path.

---

## 3. Data Flow & Transactions

When dealing with application state (React) and the persistent Data Universe, **transactions must be explicitly saved** to the database to survive a page refresh. Modifying the React `config` state alone only updates the volatile UI.

**Example: Adding a Quote/Motivation:**
When a user adds a motivation in the Settings Panel, the application performs a dual-action transaction:
1.  **State Update:** The new quote is immediately added to the React `config` state to reflect instantly in the UI without a loading spinner.
2.  **Database Transaction:** The application asynchronously calls `await universeDb.quotes.put(finalQuote)` to safely write the data to IndexedDB.

---

## 4. Synchronization & Portability (`universePorter.ts`)

Because all data is inherently local, users need a seamless way to backup, share, or move their data to a new device. The **Universe Porter** handles exporting the *entire* IndexedDB state into a single portable JSON snapshot.

### Exporting the Universe
When a user clicks "Backup Universe":
1.  Reads all words, categories, sketches, and **quotes** from IndexedDB.
2.  Iterates over all custom audio `Blob`s and converts them into serialized `Base64` strings (Data URLs).
3.  Bundles everything with the current app configuration.
4.  Downloads a comprehensive `.json` file directly to the user's device.

### Importing the Universe
When restoring data, the Porter safely merges the snapshot:
1.  **Audio:** Converts Base64 strings back to `Blob` objects and securely stores them via `audioStorage.ts`.
2.  **Words, Sketches, Quotes:** Uses Dexie's high-performance `bulkPut` method. This effectively merges the new incoming data. If an ID matches, it overwrites the local entry; if the ID is new, it creates it.

---

## 5. Versioning & Safe Schema Upgrades

As Shukr evolves, the default vocabulary inevitably changes. We handle versioning via a strict hydration process inside `useAppConfig.ts`.

### How Boot Upgrades Work
1.  On startup, the app silently fetches the remote `boot_data.json`.
2.  It compares the fetched `version` and `timestamp` against the user's `localStorage` tracking keys (`shukr_last_boot_version`, `shukr_last_boot_ts`).
3.  **If the fetched version is higher (or newer by timestamp):** The app triggers a **hydration event**. It meticulously loops over the new default words, categories, and quotes, and safely `bulkPut`s them into IndexedDB.

### Safely Modifying the Database Schema
If you need to fundamentally change the Dexie schema (e.g., adding a new table like we did for `quotes`):
1.  **Increment the Version:** Update the `.version(X)` call in your Dexie subclass constructor (`universeDb.ts`).
2.  **Write an Upgrade Script:** If you need to manipulate existing data to fit the new schema, Dexie handles migrations gracefully via the `.upgrade()` block.
    ```typescript
    this.version(3).stores({
      words: '++id, en, category, type, usageCount, lastUsedAt, newIndex', // Added newIndex
    }).upgrade(tx => {
      // Loop over existing data and populate the newIndex field safely
      return tx.table("words").toCollection().modify(word => {
          word.newIndex = word.en.toLowerCase(); 
      });
    });
    ```

---

## 6. Publishing Updates (For Developers)

When you add new default vocabulary, categories, or built-in motivations to `boot_data.json`:
1.  **Increment `version`** or **update `timestamp`** in `boot_data.json`.
2.  Commit the changes to your repository.
3.  Upon Vercel deployment, the PWA Service Worker will detect the new bundle in the background.
4.  On the user's next visit, the app will silently update. `useAppConfig` will trigger, reading the new timestamp and automatically merging the new vocabulary into their local Data Universe without destroying their existing custom additions.

---

## 7. Frequently Asked Questions (FAQ)

**Q: If I delete the app from my home screen, do I lose my custom words and voices?**
**A:** Yes. Because Shukr is an offline-first PWA, all data lives securely inside your browser's local IndexedDB. If you uninstall the PWA or clear your browser data, your local data is destroyed. **Always use the Universe Porter (Cloud Backup) to save your universe before making major device changes.**

**Q: I updated the `boot_data.json` but my app isn't showing the new words locally?**
**A:** Make sure you increment the `version` or `timestamp` inside `boot_data.json`. The app uses these numbers to know when it needs to hydrate the database. Also, check that your PWA service worker isn't serving a deeply cached version of the app.

**Q: Can I share my Voice Profile with another device?**
**A:** Yes! When you use the "Backup Universe" feature in Settings, it packages all your Voice Studio recordings (audio Blobs) into the JSON file. When you import that JSON on a new tablet or phone, the exact voice recordings are fully restored.

**Q: Why don't we use a cloud database like Firebase or Supabase?**
**A:** Privacy, Speed, and Accessibility. Shukr is designed for vulnerable seniors. By keeping all voice recordings, location data, and usage patterns strictly on the device, we guarantee absolute privacy. Furthermore, it ensures the app remains blazing fast and perfectly functional even in rural areas without internet access.
