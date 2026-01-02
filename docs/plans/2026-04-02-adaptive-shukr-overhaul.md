# Design Document: Adaptive Shukr Overhaul

**Date:** 2026-04-02  
**Status:** Approved  
**Topic:** Gesture-Driven Adaptive Communication (Shukr v2)

## 1. Objective
Transform "Shukr" from a rigid, hardcoded menu into a fluid, adaptive conversational assistant that responds to natural body language (face and hands) and learns from the user's habits.

## 2. Architecture & Systems

### 2.1 The Multi-Modal Gesture Engine (`useGestureEngine.ts`)
We will replace the current blink-only logic with a parallel tracking system using MediaPipe Face Landmarker and Hand Landmarker.

*   **Inputs:**
    *   `Index Finger Up (1)`: Move Focus Forward (Next).
    *   `Peace Sign (2)`: Move Focus Backward (Prev).
    *   `Mouth Open`: Select / Confirm.
    *   `Open Palm`: Clear Sentence / Home.
    *   `Palm + Mouth`: Trigger Attention (Flashlight + Audio Alert).
*   **Feedback:** A small, non-intrusive overlay showing detected gestures to provide confidence to the user.

### 2.2 The Living Dictionary & Smart Keyboard
A new input system designed for Roman Urdu and English with accessibility at the core.

*   **Dual-Script Keyboard:** Keys displaying both Urdu and English characters (e.g., ا/A, ب/B).
*   **Roman Urdu Support:** Optimized for transliterated Urdu (e.g., "mai theek hu").
*   **Predictive "Naani Bar":** A suggestion strip at the top of the keyboard that predicts the next word based on:
    *   Current prefix (e.g., "Pa..." -> "Paani").
    *   Historical frequency.
    *   Time of day (Contextual Awareness).
*   **Quick-Add:** A "+" button in the grid to immediately add new words/phrases using the keyboard.

### 2.3 Adaptive Grid (UI/UX)
*   **Sticky Header:** Fixed height to prevent "Speak" button overflow. The "Sentence Builder" will scroll horizontally if too long, and the "Speak" button will be a prominent, reachable action.
*   **Time-Based Prioritization:** Phrases like "Breakfast" or "Namaz" move to the front during relevant hours.
*   **Audio Butler:** A preprocessing layer for the Text-to-Speech (TTS) that corrects misspelled English or common Roman Urdu patterns for clearer vocalization.

## 3. Data Flow
1.  **Tracking:** `MediaPipe` -> Raw Landmarks.
2.  **Processing:** `GestureEngine` -> Action (Next/Prev/Select).
3.  **UI State:** `Action` -> `FocusedIndex` / `SentenceState`.
4.  **Input:** `Keyboard` -> `PredictionEngine` -> `SentenceBuilder`.
5.  **Output:** `SentenceBuilder` -> `AudioButler` -> `TTS`.

## 4. Implementation Strategy
*   **Phase 1:** Fix Header Overflow and implement `useGestureEngine` with Hand Tracking.
*   **Phase 2:** Implement the `SmartKeyboard` with dual-script support.
*   **Phase 3:** Integrate the `PredictionEngine` and Time-Based prioritization.
*   **Phase 4:** Calibration UI for gesture thresholds (to adapt to different lighting/mobility).

## 5. Success Criteria
*   User can navigate from Home to a custom typed word in under 10 gestures.
*   Zero overflow issues on standard tablet/mobile screens.
*   "Attention" gesture works reliably in under 1.5 seconds.
