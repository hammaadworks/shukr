# Voice Studio Guide

The **Voice Studio** allows family members or caregivers to record their own voices for the words and phrases in Shukr. This makes communication feel more personal and familiar for the user.

---

## 🎙️ Recording a New Voice

### Steps to Record

1.  **Open Settings:** Tap the **Settings** icon (gear) in the top-right corner.
2.  **Select Voice Studio:** Find the **Voice Studio** tab or section.
3.  **Choose a Word:** Browse the categories and select the word you want to record.
4.  **Press Record:** Tap the **Record** button and speak the word clearly.
5.  **Review & Save:** Listen to your recording. If it sounds good, tap **Save**. If not, tap **Retake**.

### Best Practices for Recording
*   **Quiet Environment:** Record in a room without background noise (fans, TV, traffic).
*   **Consistency:** Try to maintain a consistent volume and tone for all recordings.
*   **Clarity:** Speak slowly and enunciate each syllable clearly.
*   **Distance:** Hold the microphone about 6-8 inches away from your mouth to avoid "popping" sounds.

---

## 📁 Managing Recordings

### How it Works
*   **Local Storage:** All recordings are stored as **Blobs** in your browser's **IndexedDB**. They are never uploaded to a server.
*   **Fallback Logic:** If a word doesn't have a custom recording, Shukr will fall back to the default bundled audio file (if available) or use the browser's built-in Text-to-Speech (TTS).

### Exporting & Syncing
If you record voices on one device (e.g., a phone) and want to use them on another (e.g., a tablet):
1.  Go to **Settings > Universe Porter**.
2.  Tap **Export Configuration**. This will create a `.json` file containing all your settings and recordings.
3.  Transfer the file to the new device and use the **Import Configuration** feature.

---

## 🛠️ Technical Details (For Developers)

### Data Flow
1.  `useVoiceRecording.ts` handles the `MediaRecorder` API interaction.
2.  Recorded audio is converted to a `Blob` and then a `base64` string (or stored directly as a Blob in Dexie).
3.  `audioStorage.ts` provides the interface for saving and retrieving recordings from IndexedDB.
4.  `WordCard.tsx` uses the `useAudio` hook to play the correct sound based on the available sources.

### Storage Structure
The recordings are stored in the `recordings` table in the Shukr database:
```typescript
{
  wordId: string;    // ID of the word this recording is for
  blob: Blob;        // The audio data
  timestamp: number; // When it was recorded
}
```
