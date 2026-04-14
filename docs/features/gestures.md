# Gesture Control Guide

Shukr is designed to be fully navigable without touching the screen. We use **MediaPipe** to detect face and hand gestures and map them to application actions.

---

## 🖐️ Hand Gestures

Hand gestures are primarily used for navigation and specific confirmations.

| Gesture | Action | Description |
| :--- | :--- | :--- |
| **Index Finger Up (1)** | `NEXT` | Move the focus to the next word/category in the grid. |
| **Open Palm** | `CLEAR` | Clear the current sentence builder or go back to the home screen. |
| **Fist** | `YES` | Quickly speak "Yes" (ہاں) and show a visual confirmation. |

---

## 👄 Face Gestures

Face gestures are used for selection and triggering specific actions.

| Gesture | Action | Description |
| :--- | :--- | :--- |
| **Mouth Open** | `SELECT` | Select the currently focused word or category. |

---

## 🛠️ Calibration & Settings

Since every user has different mobility and lighting conditions, Shukr allows for gesture calibration.

### Threshold Adjustment
In the **Settings Panel**, you can adjust the sensitivity (threshold) for each gesture:
*   **Mouth Open Threshold:** How wide you need to open your mouth to trigger a selection.
*   **Finger Recognition Confidence:** How clearly the app needs to "see" your fingers before acting.

---

## 💡 Tips for Better Recognition

1.  **Lighting:** Ensure your face and hands are well-lit. Avoid strong backlighting (like sitting in front of a window).
2.  **Distance:** Stay about 1.5 to 3 feet (0.5 to 1 meter) away from the camera.
3.  **Contrast:** Hand gestures work best against a plain background.
4.  **Steady Position:** Try to keep your head relatively steady while using face gestures.
