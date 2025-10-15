# Shukr - Adaptive AAC Progress

## Current Architecture: Shukr v2 (Boot Data Edition)
- **Data:** Local-first with `public/boot_data.json` as the source of truth.
- **Sync:** Portable data via `UniversePorter` (Export/Import JSON).
- **TTS:** Local-only (Bundled audio + local recordings).
- **Offline:** PWA with `boot_data.json` precaching and JS-bundled fallbacks.

## Completed Features
- [x] **Phase 1: UI/UX Foundation**
  - [x] Adaptive Grid (Naani-friendly).
  - [x] Persistent Sentence Builder.
  - [x] High-contrast Nastaliq Typography.
- [x] **Phase 2: Data Portability**
  - [x] Universe Porter (Export/Import).
  - [x] Migration from Supabase to `boot_data.json` architecture.
  - [x] Version-aware bootstrapping.
- [x] **Phase 3: Local Audio**
  - [x] Removal of external TTS (Google/ElevenLabs).
  - [x] Support for local `/audio/` fallback and user-recorded profiles.
- [x] **Phase 4: Offline First**
  - [x] PWA Precaching for boot data.
  - [x] Splash screen with loading feedback.
  - [x] Offline mode notifications.

## Next Steps
- [ ] **Gesture Refinement:** Calibrating MediaPipe thresholds for various lighting conditions.
- [ ] **Contextual Prediction:** Enhancing the "Naani Bar" with more advanced time-based suggestions.
- [ ] **Doodle Training:** Expanding the default sketch template library.
