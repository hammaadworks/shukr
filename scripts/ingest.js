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
      emergency_contacts: snapshot.emergency_contacts || [],
      favorites: snapshot.favorites || [],
      voiceProfiles: snapshot.voiceProfiles || [],
      activeVoiceProfile: snapshot.activeVoiceProfile || ""
    };
    fs.writeFileSync(path.join(DATA_DIR, 'core/settings.json'), JSON.stringify(settings, null, 2));
    console.log('✓ Updated core/settings.json');

    // 2. Handle Audio Recordings (must be done before structure to update paths)
    const audioMapping = {}; // localId -> publicPath
    if (snapshot.audio) {
      ensureDir(PUBLIC_AUDIO_DIR);
      const audioKeys = Object.keys(snapshot.audio);
      console.log(`Processing ${audioKeys.length} audio recordings...`);

      for (const key of audioKeys) {
        const dataUrl = snapshot.audio[key];
        const matches = dataUrl.match(/^data:(audio\/\w+);base64,(.+)$/);
        
        if (matches) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const extension = contentType.split('/')[1] === 'webm' ? 'webm' : 'wav';
          const fileName = `${key}.${extension}`;
          const filePath = path.join(PUBLIC_AUDIO_DIR, fileName);

          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          audioMapping[key] = `/audio/recordings/${fileName}`;
        }
      }
      console.log(`✓ Saved audio recordings to ${PUBLIC_AUDIO_DIR}`);
    }

    // 3. Update core/structure.json (categories, words, quotes)
    // We need to merge audio paths into the words
    const updatedWords = (snapshot.words || []).map(word => {
      // If there's a recording for this word in any language/profile, 
      // we might want to default the 'audio' property to it if it's currently empty
      // However, the standard structure usually uses 'audio' for the base file.
      // We'll keep the word structure as is, but ensuring we don't lose custom fields.
      return {
        ...word,
        // Optional: If you want to bake the custom recording AS the vanilla audio:
        // audio: audioMapping[someKey] || word.audio
      };
    });

    const structure = {
      categories: snapshot.categories || [],
      words: updatedWords,
      quotes: snapshot.quotes || []
    };
    fs.writeFileSync(path.join(DATA_DIR, 'core/structure.json'), JSON.stringify(structure, null, 2));
    console.log('✓ Updated core/structure.json');

    // 4. Update core/sketches.json (Doodles)
    const sketches = snapshot.sketches || [];
    fs.writeFileSync(path.join(DATA_DIR, 'core/sketches.json'), JSON.stringify(sketches, null, 2));
    console.log('✓ Updated core/sketches.json');

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
        
        // Update words and categories
        if (!i18n.words) i18n.words = {};
        (snapshot.words || []).forEach(word => {
          i18n.words[word.id] = word[lang] || word.id;
        });

        if (!i18n.categories) i18n.categories = {};
        (snapshot.categories || []).forEach(cat => {
          i18n.categories[cat.id] = cat[`label_${lang}`] || cat.id;
        });

        if (!i18n.quotes) i18n.quotes = {};
        (snapshot.quotes || []).forEach(quote => {
          i18n.quotes[quote.id] = quote[lang] || quote.text_primary || quote.id;
        });

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
