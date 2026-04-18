# Adaptive Prediction Guide

Shukr features an **Adaptive Prediction Engine** that learns from a user's habits and environmental factors to suggest the most likely next word. This reduces the number of gestures or clicks needed to communicate.

---

## 🚀 How Predictions Work

### The "Naani Bar"
Predictions are displayed in a dedicated scroller at the top of the word grid, affectionately called the **Naani Bar** (after the Urdu word for maternal grandmother). This bar is always visible and provides quick access to frequently used words.

### Factors Influencing Predictions
The engine uses several factors to determine which words to suggest:
1.  **Historical Frequency:** Words used more often are prioritized.
2.  **Sequential Patterns:** If the user often says "I want" followed by "Water," the engine will suggest "Water" after "I want" is selected.
3.  **Time-Based Context:** Certain words are more relevant at different times of the day (e.g., "Breakfast" in the morning, "Bedtime" at night).
4.  **Recency:** Recently used words are given a temporary boost in the ranking.

---

## 🛠️ The Word Network (`wordNetwork.ts`)

At the core of the prediction engine is the **Word Network**. This is a data structure that tracks the relationships and transition frequencies between words.

### Key Concepts
*   **Nodes:** Represent individual words or phrases.
*   **Edges:** Represent the connection between two words (e.g., Word A followed by Word B).
*   **Weights:** Each edge has a weight that increases with every successful use of that sequence.

### Data Storage
The Word Network is stored locally in the browser's IndexedDB. This ensures that:
*   **Privacy:** Usage patterns never leave the device.
*   **Offline Functionality:** Predictions work without an internet connection.
*   **Personalization:** Every user develops their own unique network over time.

---

## ⚙️ Configuration & Management

### Resetting Predictions
If the predictions become less accurate or if the app is being used by a different person, you can reset the word network in **Settings > Advanced**. This will clear all learned frequencies and return the engine to its default state.

### Disabling Predictions
Users who find the changing order of words confusing can disable the Naani Bar in the settings. This will show a static grid of categories and words.

---

## 🛠️ Technical Implementation (For Developers)

### The `usePrediction` Hook
The `usePrediction` hook provides a reactive list of suggested words based on the current `sentence` state.

```typescript
const { predictions } = usePrediction(currentSentence);
```

### Transition Logic
When a word is added to the sentence, the `wordNetwork` is updated:
```typescript
wordNetwork.recordTransition(previousWordId, currentWordId);
```

### Time-Based Weights
The engine applies a multiplier to words tagged with specific times in `vocabulary.json`:
```json
{
  "id": "breakfast",
  "translations": { "en": "Breakfast" },
  "timeHint": "07:00-10:00"
}
```
If the current time falls within the `timeHint` range, the word's ranking is significantly boosted.
