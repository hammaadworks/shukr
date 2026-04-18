# Voice Studio Guide

The **Voice Studio** allows family members or caregivers to record their own voices for every word in the Shukr dictionary. This makes communication feel more personal and familiar for the user.

---

## 🎙️ Recording Interface

Voice Studio is an isolated, high-focus environment that operates independently of the main app language.

### Dual Language Logic
1.  **Recording Language:** The language you are currently speaking into the microphone. This changes the word labels and recording prompts.
2.  **Info Language:** The language used for the UI labels, navigation, and phonetic info tags. This can be switched via the main header.

---

## 📁 Voice Profiles

Shukr supports multiple voice profiles (e.g., "Mama's Voice (UR)", "Brother's Voice (EN)").

### System vs. Custom Voices
*   **System Voices:** Pre-loaded audio assets that are **Locked**. They cannot be renamed, deleted, or overwritten to ensure a stable baseline.
*   **Custom Voices:** User-created profiles. These are fully editable. You can rename the profile at any time, and every recording will automatically map to the new name via its unique ID.

---

## 🛠️ Data & Storage

### Naming Convention
Audio recordings are stored using a strictly structured composite key:
`[lang]_voice_[voiceName]_[wordId]`

Example: `ur_voice_naani_paani`

### Storage Integrity
*   **IndexedDB:** All recordings are stored as raw binary `.wav` files in the `audio` table.
*   **Export Protection:** When you export your configuration, all custom voices are converted to "System Voices" (`editable: false`) to prevent accidental deletion on the target device.

---

## 💡 Best Practices
1.  **Quiet Environment:** Record in a room without background noise (fans, TV).
2.  **Clarity First:** Speak slowly and enunciate each syllable.
3.  **Info Mode:** Use the **Info Language** feature to see phonetic pronunciations in your own language while you record words in another language.
