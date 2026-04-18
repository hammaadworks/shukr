# Vocabulary Management

Shukr manages a rich, multilingual dictionary through a unified schema that prioritizes phonetic accuracy and visual discovery.

---

## 1. Core Vocabulary Schema

The master dictionary is stored in `src/lib/data/core/vocabulary.json`. Every word entry follows a strict lean structure:

```json
{
  "id": "apple",
  "icon": "apple",
  "next": ["want", "eat"],
  "usageCount": 0,
  "lastUsedAt": 0,
  "doodle_shapes": ["circle", "outline"],
  "translations": {
    "en": "Apple",
    "ur": "سیب",
    "es": "Manzana"
  },
  "transliterations": {
    "ur": { "en": "seb" },
    "en": { "ur": "ایپل" }
  }
}
```

### Key standards:
*   **Unique IDs:** Always lowercase, no spaces (use underscores).
*   **Transliteration Matrix:** Phonetic pronunciations must be script-accurate, not just direct translations.
*   **Doodle Shapes:** Used for visual similarity matching.

---

## 2. Voice Profiles Metadata

Voice profile defaults are stored in `src/lib/data/core/voiceProfiles.json`. This keeps generic settings decoupled from voice metadata.

```json
{
  "id": "ur_voice_naani",
  "name": "Naani",
  "language": "ur",
  "editable": false
}
```

---

## 3. Management Scripts

### Adding a New Word
Adds a word with full schema support to the local JSON file.
```bash
node scripts/add-word.cjs --en=Water --ur=پانی --icon=droplet
```

### Hard Deleting a Word
Surgically removes a word and all associated audio/doodle assets from the repository.
```bash
node scripts/hard-delete-word.cjs --id=apple
```

### Ingesting Snapshots
Bakes user-generated data (from the app's export) into the static project files.
```bash
node scripts/ingest.js snapshot.json
```

---

## 4. Visual Discovery (Doodle Shapes)

Words are categorized visually for the Doodle recognition engine using Naani's mental model:
- **circle**: Round items (Faces, Clock, Plate).
- **triangle**: Pointy items (Samosa, Carrot).
- **square**: Boxy items (Book, Quran, Phone).
- **wave**: Flowing items (Water, Juice).
- **zigzag**: Sharp/Urgent (Pain, Fever).
