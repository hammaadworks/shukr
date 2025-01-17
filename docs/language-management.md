# Language Management & Localization Guide

Shukr is built to be a global platform. This guide explains how to add a new language from scratch, the exact code locations to modify, and how to automate the process.

---

## 🛠️ Manual Step-by-Step Guide

### 1. Create the Translation Pack
**Location:** `src/lib/data/i18n/`
Create a new file named `[lang_code].json` (e.g., `bn.json` for Bengali).
*   **Action:** Copy the contents of `src/lib/data/i18n/en.json` into your new file.
*   **Action:** Translate the values for `categories`, `words`, and `quotes`. Keep the keys (IDs) exactly the same as they are in `en.json`.

### 2. Register the Language in UI
**Location:** `src/components/SettingsPanel.tsx`
*   **Action:** Find the `SUPPORTED_LANGS` constant near the top of the file.
*   **Action:** Add your language object: `{ code: 'bn', label: 'Bengali (বাংলা)' }`.

### 3. Configure Layout Direction (RTL vs LTR)
**Location:** `src/hooks/useLanguage.tsx`
*   **Action:** Find the `getDirection` helper function.
*   **Action:** If your language is Right-to-Left (like Arabic or Hebrew), add its code to the `rtlLangs` array.

### 4. Verify & Build
*   **Action:** Run `pnpm dev` and go to **Settings > Lang** to select your new language.
*   **Action:** Open **Voice Studio**; it should automatically detect the new language for recording.

---

## 🤖 AI Agent Automation (Copy-Paste Prompt)

If you are using an AI agent to perform these changes, use the prompt below. It is designed to be safe, inquisitive, and thorough.

### The "Add Language" Prompt:
> "You are acting as a Senior Software Engineer for the Shukr Project. Your objective is to add full support for a new language.
>
> **Step 1: Research & Inquiry**
> Ask me which language I want to add. Once I provide it, check the `src/lib/data/i18n/` directory. If the language pack already exists, stop and inform me. If not, ask me if the language is Right-to-Left (RTL) or Left-to-Right (LTR).
>
> **Step 2: Core Data Generation**
> Read `src/lib/data/i18n/en.json` to understand the schema. Create a new file `src/lib/data/i18n/[lang_code].json`. You must translate all category names and core words into the target language accurately.
>
> **Step 3: Registration**
> 1. Modify `src/components/SettingsPanel.tsx`: Add the new language to the `SUPPORTED_LANGS` array.
> 2. Modify `src/hooks/useLanguage.tsx`: Update the `getDirection` function to include the new language code if it is RTL.
>
> **Step 4: Validation**
> Review all modified files. Ensure that the IDs in the new i18n file match `src/lib/data/core/vocabulary.json` exactly. Ensure no type errors are introduced.
>
> **Step 5: Execution**
> Do not apply changes until you have confirmed the language and direction with me. Once confirmed, proceed with the implementation autonomously.
>
> Please start by asking me which language you should implement today."

---

## 📂 Key File Summary for Contributors

| Task | File Path |
| :--- | :--- |
| **Translation Pack** | `src/lib/data/i18n/[code].json` |
| **UI Registration** | `src/components/SettingsPanel.tsx` |
| **RTL/LTR Logic** | `src/hooks/useLanguage.tsx` |
| **Data Assembly** | `src/lib/dataAssembler.ts` |
| **Voice Storage Key** | `src/hooks/useAudio.ts` |

By following these steps, you ensure that the "Universe" remains consistent across all devices while providing a familiar, trusted experience for the user.
