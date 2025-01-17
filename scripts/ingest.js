const fs = require('fs');
const path = require('path');

/**
 * Ingests a Shukr "Data Universe" snapshot and updates the project's static data.
 * This script transforms user-generated state into the "vanilla" repository state.
 * Usage: node scripts/ingest.js path/to/shukr_backup.json
 */

const snapshotPath = process.argv[2];

if (!snapshotPath) {
  console.error('Error: Please provide the path to the snapshot JSON file.');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, '../src/lib/data');
const PUBLIC_AUDIO_DIR = path.join(__dirname, '../public/audio/recordings');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function run() {
  try {
    const rawData = fs.readFileSync(snapshotPath, 'utf8');
    const snapshot = JSON.parse(rawData);

    console.log(`Ingesting snapshot from ${new Date(snapshot.timestamp).toLocaleString()}...`);

    // 1. Update core/settings.json
    const settings = {
      version: snapshot.version || 1,
      timestamp: Date.now(),
      user_nickname: snapshot.user_nickname || "Bade Ammi",
      emergency_contacts: snapshot.emergency_contacts || [],
      sos_settings: snapshot.sos_settings || {
        message_template: "I need help immediately!",
        countdown_seconds: 5,
        play_alarm_sound: true
      },
      preferences: snapshot.preferences || {
        theme: "light",
        font_size: "large",
        speech_rate: 0.9,
        enable_vibration: true,
        enable_click_sound: true,
        auto_clear_minutes: 5
      },
      language_pair: snapshot.language_pair || {
        primary: "ur",
        secondary: "en"
      },
      favorites: snapshot.favorites || [],
      voiceProfiles: snapshot.voiceProfiles || [],
      activeVoiceProfile: snapshot.activeVoiceProfile || ""
    };
    fs.writeFileSync(path.join(DATA_DIR, 'core/settings.json'), JSON.stringify(settings, null, 2));
    console.log('✓ Updated core/settings.json');

    // 2. Audio Ingestion logic
    ensureDir(PUBLIC_AUDIO_DIR);
    const audioKeys = Object.keys(snapshot.audio || {});
    console.log(`Ingesting ${audioKeys.length} audio clips...`);

    // Prune existing files not in the snapshot
    const existingFiles = fs.readdirSync(PUBLIC_AUDIO_DIR);
    existingFiles.forEach(file => {
      const id = path.basename(file, path.extname(file));
      if (!snapshot.audio[id]) {
        fs.unlinkSync(path.join(PUBLIC_AUDIO_DIR, file));
        console.log(`  - Deleted orphaned audio: ${file}`);
      }
    });

    // Save/Update files from snapshot
    for (const [id, dataUrl] of Object.entries(snapshot.audio || {})) {
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) continue;
      
      const buffer = Buffer.from(base64Data, 'base64');
      // All audio files are stored as .webm by default
      const fileName = `${id}.webm`;
      fs.writeFileSync(path.join(PUBLIC_AUDIO_DIR, fileName), buffer);
    }
    console.log('✓ Updated public/audio/recordings/');

    // 3. Update core/vocabulary.json (words, quotes) - NO CATEGORIES
    const vocabulary = {
      quick_actions: snapshot.quick_actions || [],
      words: snapshot.words || [],
      quotes: snapshot.quotes || []
    };
    fs.writeFileSync(path.join(DATA_DIR, 'core/vocabulary.json'), JSON.stringify(vocabulary, null, 2));
    console.log('✓ Updated core/vocabulary.json');

    // 4. Update core/doodle.json (Doodles)
    const doodles = snapshot.doodles || snapshot.sketches || [];
    fs.writeFileSync(path.join(DATA_DIR, 'core/doodle.json'), JSON.stringify(doodles, null, 2));
    console.log('✓ Updated core/doodle.json');

    // 5. Update dictionary.json (English -> Urdu lookup)
    const dictionary = {};
    (snapshot.words || []).forEach(word => {
      dictionary[word.id] = word.ur || word.text_secondary || word.id;
    });
    fs.writeFileSync(path.join(DATA_DIR, 'dictionary.json'), JSON.stringify(dictionary, null, 2));
    console.log('✓ Updated dictionary.json');

    // 6. Update i18n files
    const languages = ['en', 'ur', 'ar', 'es'];
    languages.forEach(lang => {
      const i18nPath = path.join(DATA_DIR, `i18n/${lang}.json`);
      if (fs.existsSync(i18nPath)) {
        const i18n = JSON.parse(fs.readFileSync(i18nPath, 'utf8'));
        
        // Reset words and quotes from snapshot (Absolute Source of Truth)
        i18n.words = {};
        (snapshot.words || []).forEach(word => {
          i18n.words[word.id] = word[lang] || word.text_primary || word.id;
        });

        i18n.quotes = {};
        (snapshot.quotes || []).forEach(quote => {
          i18n.quotes[quote.id] = quote[lang] || quote.text_primary || quote.id;
        });

        // Categories are fixed now
        if (!i18n.categories) {
           i18n.categories = {
             favorite: lang === 'ur' ? 'پسندیدہ' : (lang === 'ar' ? 'المفضلة' : (lang === 'es' ? 'Favoritos' : 'Favorite')),
             family: lang === 'ur' ? 'خاندان' : (lang === 'ar' ? 'عائلة' : (lang === 'es' ? 'Familia' : 'Family')),
             general: lang === 'ur' ? 'عام' : (lang === 'ar' ? 'عام' : (lang === 'es' ? 'General' : 'General'))
           };
        }

        fs.writeFileSync(i18nPath, JSON.stringify(i18n, null, 2));
        console.log(`✓ Updated i18n/${lang}.json`);
      }
    });

    console.log('\nSuccess! Your "Data Universe" has been baked into the repository.');
    console.log('You can now git add/commit/push these changes.');

  } catch (err) {
    console.error('Error during ingestion:', err);
    process.exit(1);
  }
}

run();
