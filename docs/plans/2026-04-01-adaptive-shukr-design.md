# Design Document: Adaptive Shukr (Practical AAC)

**Date:** 2026-04-01
**Status:** Approved
**Objective:** A cross-platform AAC PWA designed for a Muslim, Urdu-speaking grandmother. It focuses on practical, immediate communication (yes/no, pain types, daily needs) and features high-quality Urdu TTS via ElevenLabs. The UI is customizable by family members to add specific vocabulary as needed.

---

## 1. System Architecture
- **App Layer:** React (Vite) + TypeScript + PWA.
- **Data Layer (Local):** `IndexedDB` for offline-first event logging, local configuration storage, and audio caching.
- **Cloud Layer (Sync):** Supabase (PostgreSQL) for raw interaction data and remote app configuration.
- **Media:** ElevenLabs API for high-quality Indian/Pakistani female Urdu TTS + Web Media API (Flashlight/Attention Signal).

## 2. Core Features (The Practical UI)
The interface is designed to bridge the communication gap without being overwhelming, addressing critical use cases like video calls and acute illness (e.g., shingles).

- **Always-Visible Quick Responses:** A persistent top/bottom bar with instant answers for conversations: "Haan" (Yes), "Nahi" (No), "Mujhe nahi pata" (I don't know), and "Ruko" (Wait).
- **Internal Feelings & Pain Types:** Focuses on *how* it hurts (since she can point to *where*). Dedicated buttons for "Jalan" (Burning), "Khujli" (Itching), "Chakkar" (Dizzy), "Matli" (Nauseous), "Sardi lag rahi hai" (Cold).
- **Daily Actionable Needs Grid:** A clean grid for specific requests: "Paani" (Water), "Chai" (Tea), "Dawaii" (Medicine), "AC/Fan adjust karo", "Bathroom".
- **Family Customization (Admin Mode):** A hidden settings area (long-press to access) where family can add new buttons, type Urdu text, and fetch/cache new ElevenLabs audio.

## 3. Data Collection & Sync
The app will log interactions to a local `outbox`, synced to Supabase.
- Tracks tap frequency to help the family prioritize and reorder buttons.
- App UI configuration is synced from Supabase (`remote_config.json`) to allow remote updates from family members.

## 4. UI/UX Principles
- **Urdu First:** Nastaliq font (Google Noto Sans Arabic) as the default.
- **High Contrast & Low Cognitive Load:** Large touch targets, clear icons, and a flat hierarchy (no deep sentence building menus).
- **Zero-Friction Audio:** All common phrases are pre-generated and cached locally via ElevenLabs to ensure instant offline playback.

## 5. Implementation Phases
1. **Phase 1: UI Revamp & Core Navigation** - Implement the persistent Quick Responses bar and the main Needs/Feelings grids.
2. **Phase 2: ElevenLabs TTS Integration** - Replace Web Speech API with ElevenLabs. Implement audio caching in IndexedDB for instant, offline playback.
3. **Phase 3: Family Admin Dashboard** - Build the local hidden admin screen for adding/editing buttons and generating TTS.
4. **Phase 4: Remote Sync & Analytics** - Connect local config and outbox logs to Supabase for remote updates and usage tracking.
