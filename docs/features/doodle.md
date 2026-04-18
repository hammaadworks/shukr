# Doodle Mode Guide

**Doodle Mode** is a powerful visual interaction feature in Shukr that allows users to communicate by drawing simple symbols.

---

## 🎨 Interaction Flow

1.  **Select Doodle:** Tap the Pen icon or use a mapped gesture.
2.  **Draw:** Use your finger or a stylus to draw a simple shape.
3.  **Real-Time Prediction:** As you draw, the top-bar dynamically updates with words that match your visual style.
4.  **Confirm:** Tap the prediction to add it to your sentence.

---

## 🧠 Custom Training

Shukr allows every user to train the system to recognize their unique way of drawing a concept.

### Steps to Train
1.  **Open Word Manager:** Navigate to `#words`.
2.  **Select a Word:** Find the word you want to associate with a custom sketch.
3.  **Train:** Draw the symbol at least once in the training box and tap **Save**.
4.  **Persistence:** Your custom vectors are saved in the `doodles` table in IndexedDB.

---

## 🛠️ Technical Details

### Recognition Engine
*   **Vector Scaling:** Every stroke is automatically normalized to a 0-100 coordinate system, ensuring recognition works regardless of the size or position of the drawing.
*   **Similarity Matching:** Uses a custom geometric matcher to compare live input against pre-trained system templates and user-specific custom templates.
*   **Optimized Schema:** Training data no longer stores redundant metadata like categories or timestamps, keeping the database extremely light.

---

## 💡 Best Practices
*   **Simple Geometry:** Focus on core shapes (circles, triangles, lines).
*   **Consistency:** Train words you use most frequently to build a fast, intuitive visual shorthand.
