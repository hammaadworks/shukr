# Customizing Shukr

Shukr is designed to be highly tailorable to each user's specific needs. Whether you're a caregiver adding words or a developer creating a custom configuration, this guide will show you how.

---

## 🛠️ In-App Customization

The simplest way to customize Shukr is using the built-in **Settings Panel**.

### Adding New Words & Categories
1.  **Open Settings:** Tap the gear icon in the top-right.
2.  **Word Editor:** Navigate to the **Word Editor** tab.
3.  **New Word:** Tap the **Add Word (+)** button.
4.  **Details:** Enter the English text, Urdu text (optional), and assign it to a category.
5.  **Save:** The new word will immediately appear in your grid.

### Personalizing with Voice
Use the **Voice Studio** (within Settings) to record custom audio for any word. This is great for family names, specific food items, or unique phrases.

### Adjusting Gestures
If the default gestures aren't working well, go to **Settings > Gestures** to:
*   Adjust sensitivity thresholds.
*   Toggle specific gestures on/off.
*   Enable/disable the visual feedback overlay.

---

## 📂 Configuration as Code (`boot_data.json`)

For large-scale changes or for developers setting up a new default experience, you can modify `src/boot_data.json`. This file is the "seed" data for the entire application.

### File Structure
```json
{
  "categories": [
    {
      "id": "food",
      "name": "Food",
      "urduName": "کھانا",
      "icon": "Utensils",
      "items": [
        {
          "id": "water",
          "text": "Water",
          "urduText": "پانی",
          "audio": "/audio/water.mp3",
          "timeHint": "all"
        }
      ]
    }
  ],
  "settings": {
    "defaultLanguage": "ur",
    "gestureSensitivity": 0.7
  }
}
```

### Deployment with Custom Data
1.  Modify `src/boot_data.json` with your custom categories and words.
2.  Run `pnpm build` to bundle your changes.
3.  Deploy the generated `dist/` folder. The app will initialize with your custom data for every new user.

---

## 🌍 The Universe Porter

The **Universe Porter** is Shukr's data portability system. It allows you to move your entire personalized "universe" (words, recordings, and settings) between devices.

### Syncing Across Devices
1.  **Export:** On the source device (e.g., a phone), go to **Settings > Universe Porter** and tap **Export Configuration**. A `.json` file will be downloaded.
2.  **Transfer:** Send the file to the target device (e.g., a tablet) via email, messaging, or cloud storage.
3.  **Import:** On the target device, go to **Settings > Universe Porter**, tap **Import Configuration**, and select the file you just transferred.
4.  **Done!** All your words and recordings are now synced.

*Note: Importing a configuration will overwrite the existing local configuration on the device.*

---

## 🎨 Styling & Themes

Shukr uses **CSS Modules** for styling. If you want to change the look and feel (colors, fonts, sizes):
1.  Navigate to `src/styles/`.
2.  **Tokens:** Use `tokens.css` to change global variables like primary colors, spacing, and border radiuses.
3.  **Nastaliq:** If you want to use a different Urdu font, update the `@font-face` declaration in `base.css`.
