# Shukr Architecture Overview

Shukr is a modern, offline-first Progressive Web App (PWA) designed for high-accessibility communication. Built with React and TypeScript, it empowers users with speech and mobility challenges through an adaptive, multi-modal interface.

---

## 1. Core Principles
*   **Offline-First:** Fully functional without internet once installed.
*   **Unified Local Storage:** All user data (recordings, custom words, ML templates, and preferences) is stored strictly in a single, linear IndexedDB source of truth.
*   **Privacy-Centric:** Data never leaves the device. Voice recordings and gestures are processed locally on the client's hardware.
*   **Multilingual Architecture:** Native support for 7+ languages (Urdu, English, Spanish, Arabic, Hindi, Chinese, French) with bidirectional transliteration and Right-to-Left (RTL) logic.
*   **Senior-Friendly UX:** Optimized for high-aspect-ratio mobile devices with large tactile targets, glassmorphic UI elements, and minimal cognitive load (no scrolling).

---

## 2. System Architecture

### A. Multi-Modal Gesture Engine (`/src/recognition/`)
A real-time processing pipeline powered by **MediaPipe**.
*   **Input:** Camera feed processed via Face, Hand, and Iris landmarkers.
*   **Logic:** Maps raw biological landmarks to intent (e.g., `Mouth Open` -> `SELECT`, `Index Up` -> `NEXT`).
*   **Custom Training:** Users can train the system to recognize their specific drawing style (Doodle Mode) or hand gestures.

### B. Predictive Engine (`/src/lib/predictionsEngine.ts`)
An intelligent Markov-chain based engine that reduces communication friction by learning from user behavior.
*   **Sequential Learning:** Records transitions between words to suggest the most likely next word.
*   **Naani Bar:** A dedicated UI component surfacing these dynamic predictions at the top of the interaction grid.

### C. Voice Studio & Audio Pipeline (`/src/components/VoiceStudio/`)
The personalization hub for custom voice synthesis.
*   **Recording vs. Info Lang:** Decouples the language being recorded from the language used to render the UI instructions.
*   **Composite Key Storage:** Audio is stored in IndexedDB using a strict `<lang>_voice_<name>_<wordId>` key format for high-speed lookups.
*   **System Locking:** Pre-loaded system voices are immutable, ensuring core assets are never accidentally overwritten.

### D. Data Portability (Universe Porter)
*   **Universe Snapshot:** Encapsulates the entire application state—including binary audio blobs—into a single portable JSON bundle.
*   **Porter Logic:** Handles the serialization of IndexedDB tables into Base64 for cross-device migration.

---

## 3. Data Flow & Structure

### Unified Database (`src/lib/universeDb.ts`)
Shukr utilizes a single Dexie-managed database: `shukr_universe_db`.
1.  **`words`**: Stores the flat vocabulary list and usage statistics.
2.  **`doodles`**: Stores vector stroke data for visual recognition.
3.  **`audio`**: Stores binary `.wav` blobs for custom recordings.
4.  **`settings`**: Manages dynamic user preferences (Family, Favorites, SOS).
5.  **`voiceProfiles`**: Metadata for custom-cloned voices.
6.  **`quotes`**: Daily spiritual and motivational snippets.

---

## 4. Tech Stack
*   **Frontend:** React 18 + Vite + TypeScript.
*   **ML Engine:** MediaPipe (Google).
*   **Database:** Dexie.js (IndexedDB wrapper).
*   **Styling:** CSS Modules + Unified Design Tokens (24px Radius, Glassmorphism).
*   **PWA:** `vite-plugin-pwa` for 100% offline reliability.
*   **Icons:** Lucide React.
