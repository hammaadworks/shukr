# Data Universe Architecture

The **Data Universe** is the core foundational architecture of Shukr. It manages all persistent storage, cross-device synchronization, and multilingual mapping through a unified source of truth.

---

## 1. Unified Storage Philosophy

Shukr operates as a strictly **offline-first and local-only** Progressive Web App. 

All user data is stored entirely on the local device using **IndexedDB** (via `Dexie.js`). This ensures:
1.  **Instant Availability:** Zero latency even in areas with poor connectivity.
2.  **Absolute Privacy:** Personal voice recordings and custom word lists never leave the device unless explicitly exported by the user.

---

## 2. Schema Definition (`shukr_universe_db`)

The database utilizes a single linear schema (Version 1) to eliminate redundant storage logic.

### A. Vocabulary (`words`)
Stores the master dictionary and sequential learning data.
*   `id`: Primary key (e.g., `apple`).
*   `translations`: Record of 7+ languages (e.g., `{"ur": "سیب", "en": "Apple"}`).
*   `transliterations`: Record of phonetic guides (e.g., `{"ur": {"en": "seb"}}`).
*   `usageCount`: Number of times the word has been selected.
*   `lastUsedAt`: Unix timestamp of last selection.
*   `verified`: Boolean flag indicating manual review of metadata.

### B. Visual Recognition (`doodles`)
Stores trained vector data for the Doodle Mode interaction.
*   `id`: Unique key formatted as `${wordId}_${timestamp}`.
*   `wordId`: Foreign key mapping to a `word`.
*   `strokes`: Array of mathematical coordinate objects `[{x, y, t}, ...]`.

### C. Voice Profiles (`voiceProfiles`)
Metadata for cloned voices.
*   `id`: Unique key (e.g., `ur_voice_mama`).
*   `name`: Display name (e.g., `Mama`).
*   `language`: The primary language for this voice.
*   `editable`: Boolean. If `false`, this is a system voice and cannot be renamed or overwritten.

### D. Audio Blobs (`audio`)
Stores raw binary `.wav` files.
*   `id`: Composite primary key following the strict format: `<lang>_voice_<name>_<wordId>`.
*   `blob`: Binary audio data.

### E. Dynamic Configuration (`settings`)
A key-value store for preferences that overrides static defaults.
*   `key`: Identifier (e.g., `favorites`, `family`, `sos_settings`).
*   `value`: Serialized JSON object or array.

---

## 3. Data Portability: The Universe Porter

The **Universe Porter** (`universePorter.ts`) provides a robust mechanism for migrating state between devices.

### Serialization Strategy
*   **Audio Conversion:** The Porter automatically converts binary `Blobs` from the `audio` table into Base64 strings during export.
*   **Snapshot Format:** A single JSON bundle containing all database tables.
*   **Security:** During export, all profiles are flagged as `editable: false` to ensure data integrity when shared across caregivers' devices.

---

## 4. Ingestion Pipeline

User-generated state can be baked into the repository using the ingestion script:
```bash
node scripts/ingest.js path/to/snapshot.json
```
This script surgically updates the local `src/lib/data/core/` JSON files and extracts audio recordings into their dedicated directory for permanent deployment.
