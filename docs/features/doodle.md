# Doodle Mode Guide

**Doodle Mode** is a powerful feature in Shukr that allows users to communicate through sketches and hand-drawn symbols. This is particularly useful for users who find it easier to draw than to navigate menus or who have specific symbols they use for communication.

---

## 🎨 How to Use Doodle Mode

### Drawing a Symbol
1.  **Enter Doodle Mode:** Select the **Doodle** icon from the main category list or through a gesture.
2.  **Draw on the Canvas:** Use your finger (or a stylus) to draw a symbol on the canvas area.
3.  **View Predictions:** As you draw, the **Doodle Predictions Bar** at the top will show the words it thinks you are drawing.
4.  **Select a Word:** Tap on the correct word to add it to your sentence builder.

### Tools & Controls
*   **Clear:** Wipe the canvas clean to start a new drawing.
*   **Undo:** Remove the last stroke you made.
*   **Speak:** Immediately vocalize the top prediction.

---

## 🧠 Training Your Own Symbols

Shukr comes with a default set of symbols, but you can train it to recognize your own custom drawing style.

### Steps to Train
1.  **Open Training Modal:** Go to **Settings > Doodle Training** or select the **Train** button in the Doodle toolbar.
2.  **Select a Word:** Choose the word you want to associate with your new symbol.
3.  **Draw 3-5 Times:** Draw the symbol multiple times to help the model learn your variation.
4.  **Save:** Tap **Save Training**. The app will now be more likely to recognize that specific drawing as the chosen word.

---

## 🛠️ Technical Details (For Developers)

### Recognition Engine
*   **Architecture:** Doodle recognition is powered by a local **Neural Network** or a **k-Nearest Neighbors (k-NN)** classifier running in the browser.
*   **Preprocessing:** Strokes are normalized for size and position to ensure recognition works regardless of where you draw on the canvas.
*   **Data Storage:** Custom training data is saved to IndexedDB, allowing for a personalized model for every user.

### Key Components
*   `DoodleCanvas.tsx`: The drawing surface with touch/mouse event handling.
*   `DoodlePredictions.tsx`: Renders the top matches based on the current canvas state.
*   `engine.ts`: The core logic for stroke processing and classification.

---

## 💡 Best Practices for Users
1.  **Simple Strokes:** Stick to simple, recognizable shapes (e.g., a circle for "sun," a triangle for "food").
2.  **Consistent Style:** Try to draw the same symbol in a similar way each time.
3.  **Use Training:** If the app consistently misidentifies your drawing, use the training feature to correct it.
