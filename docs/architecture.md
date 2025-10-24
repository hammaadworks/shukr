# Shukr Architecture Overview

Shukr is a modern, offline-first PWA built using React and TypeScript. This document provides a high-level overview of how the system is structured.

---

## 1. Core Principles
*   **Offline-First:** Fully functional without internet once installed.
*   **Local-Only Data:** All user data (recordings, custom words) is stored in the browser's `IndexedDB`.
*   **Adaptive UX:** The interface learns from user habits and environment.
*   **Accessibility First:** Focus on senior-friendly design and gesture-based navigation.

---

## 2. System Architecture

### A. The Multi-Modal Gesture Engine (`/src/recognition/`)
Handles all gesture-based interactions using **MediaPipe**.
*   **Input:** Camera feed processed via Face Landmarker and Hand Landmarker.
*   **Processing:** Maps raw landmarks (e.g., mouth open, index finger up) to application actions.
*   **Actions:** `NEXT`, `PREV`, `SELECT`, `CLEAR`, `HOME`, `ATTENTION`.
*   **Hooks:** `useCameraGestures.ts`, `useFaceTracking.ts`.

### B. Adaptive Word Network (`/src/lib/wordNetwork.ts`)
Manages relationships between words, categories, and frequencies.
*   **Prediction Engine:** Predicts the next likely word based on historical usage and time of day.
*   **Contextual Awareness:** Surfaces relevant words (e.g., "Breakfast" in the morning).
*   **Naani Bar:** A dedicated UI component for displaying these predictions at the top of the grid.

### C. Voice & Ambient Listener (`/src/hooks/`)
Handles voice-activated features and custom recordings.
*   **Voice Studio:** Allows recording personal voices for any word.
*   **Ambient Listener:** Listens for specific voice triggers to perform actions hands-free.
*   **Audio Storage:** Custom recordings are stored as Blobs in IndexedDB via `audioStorage.ts`.

### D. Doodle Mode (`/src/components/Doodle/`)
A canvas-based communication module.
*   **Interaction:** User draws sketches or symbols.
*   **Recognition:** Local ML model identifies doodles and suggests corresponding words.
*   **Training:** Users can train the system on their custom sketch style.

### E. Data Portability & Storage
*   **IndexedDB (Dexie):** Primary persistent storage for all user-generated content.
*   **Universe Porter (`/src/lib/universePorter.ts`):** Handles exporting/importing the entire app state as a JSON bundle.
*   **Boot Data (`src/boot_data.json`):** The default seed data used to initialize the application.

---

## 3. Component Hierarchy

```text
App.tsx (Global State & Gesture Engine)
├── Header.tsx (Settings & Status)
├── SentenceBuilder.tsx (Current Message)
├── PredictionScroller.tsx (The "Naani Bar")
├── Main Grid (Conditional Rendering)
│   ├── WordGrid.tsx (Standard AAC)
│   ├── CategorySlider.tsx (Navigation)
│   └── DoodlePad.tsx (Sketch Mode)
├── VoiceStudio.tsx (Recordings)
└── Footer.tsx (Quick Actions)
```

---

## 4. Tech Stack
*   **Framework:** React (Vite) + TypeScript.
*   **Styling:** Custom CSS Modules for precise control.
*   **ML/Gestures:** MediaPipe (Face/Hand/Iris).
*   **Storage:** Dexie (IndexedDB), idb-keyval.
*   **PWA:** `vite-plugin-pwa` for service worker management.
*   **Icons:** Lucide React for consistent UI.
