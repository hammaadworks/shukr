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

## 🌍 Global Customization & Localization

Shukr was born out of a desire to help those with speech challenges worldwide. While it defaults to Urdu and English, it is designed to be adapted for any language, script, or cultural context.

### Supporting a New Language
To add a third language (e.g., Arabic, Spanish, or Bengali), a few code adjustments are required:

1.  **Define the Language:** In `src/hooks/useLanguage.tsx`, update the `Language` type:
    ```typescript
    type Language = 'ur' | 'en' | 'ar'; // Adding Arabic
    ```
2.  **Update Provider:** Add logic in `LanguageProvider` to handle the new language's direction (RTL/LTR).
3.  **UI Toggle:** Update the `toggleLang` function in `src/components/Header.tsx` to cycle through the available languages instead of a binary switch.
4.  **Data Schema:** Ensure your `boot_data.json` includes the new language keys (e.g., `label_ar`, `text_ar`).

### Regional Content Adaptation
AAC is most effective when it uses familiar symbols and phrases.
*   **Categories:** Replace existing categories in `boot_data.json` with ones relevant to your region (e.g., local foods, family titles like 'Abuelo' or 'Dada').
*   **Spiritual/Cultural Quotes:** Update the `quotes` array in `boot_data.json` with verses or sayings meaningful to the user's culture or faith.
*   **Custom Icons:** Use the `icon` field in categories to select from the [Lucide Icon library](https://lucide.dev/icons) used by Shukr.

### Open Source Contribution
If you adapt Shukr for a new language or region, please consider contributing your configuration or code back to the community! This helps make communication accessible for everyone, everywhere.
