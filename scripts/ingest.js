const fs = require('fs');
const path = require('path');

const snapshotPath = process.argv[2];
if (!snapshotPath) { console.error('Error: Please provide snapshot path.'); process.exit(1); }

const DATA_DIR = path.join(__dirname, '../src/lib/data');
const INTERNAL_AUDIO_DIR = path.join(DATA_DIR, 'core/audio');

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

async function run() {
    try {
        const rawData = fs.readFileSync(snapshotPath, 'utf8');
        const snapshot = JSON.parse(rawData);
        console.log(`Ingesting snapshot from ${new Date(snapshot.timestamp).toLocaleString()}...`);

        // 1. Update core/settings.json
        const settingsArray = snapshot.settings || [];
        const settingsObj = {};
        settingsArray.forEach(item => {
            if (item.key) settingsObj[item.key] = item.value;
        });

        let defaultSettings = {};
        try {
            defaultSettings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'core/settings.json'), 'utf8'));
        } catch (e) {
            console.warn("Could not read default settings.json, creating new.");
        }

        const settings = {
            ...defaultSettings,
            ...settingsObj,
            version: snapshot.version || defaultSettings.version || 2,
            timestamp: Date.now(),
            user_nickname: snapshot.user_nickname || settingsObj.user_nickname || defaultSettings.user_nickname || "Bade Ammi",
            emergency_contacts: snapshot.emergency_contacts || settingsObj.emergency_contacts || defaultSettings.emergency_contacts || [],
            sos_settings: snapshot.sos_settings || settingsObj.sos_settings || defaultSettings.sos_settings || { message_template: "I need help!", countdown_seconds: 5, play_alarm_sound: true },
            preferences: snapshot.preferences || settingsObj.preferences || defaultSettings.preferences || { theme: "light", font_size: "large", speech_rate: 0.9, enable_vibration: true, enable_click_sound: true, auto_clear_minutes: 5 },
            language_pair: snapshot.language_pair || settingsObj.language_pair || defaultSettings.language_pair || { primary: "ur", secondary: "en" },
            favorites: snapshot.favorites || settingsObj.favorites || defaultSettings.favorites || [],
            family: snapshot.family || settingsObj.family || defaultSettings.family || [],
            activeVoiceProfile: snapshot.activeVoiceProfile || settingsObj.activeVoiceProfile || defaultSettings.activeVoiceProfile || ""
        };
        fs.writeFileSync(path.join(DATA_DIR, 'core/settings.json'), JSON.stringify(settings, null, 2));

        const voiceProfiles = snapshot.voiceProfiles || settingsObj.voiceProfiles || defaultSettings.voiceProfiles || [];
        fs.writeFileSync(path.join(DATA_DIR, 'core/voiceProfiles.json'), JSON.stringify(voiceProfiles, null, 2));

        // 2. Audio Ingestion
        ensureDir(INTERNAL_AUDIO_DIR);
        let audioCount = 0;
        for (const [id, dataUrl] of Object.entries(snapshot.audio || {})) {
            const base64Data = dataUrl.split(',')[1];
            if (!base64Data) continue;
            fs.writeFileSync(path.join(INTERNAL_AUDIO_DIR, `${id}.wav`), Buffer.from(base64Data, 'base64'));
            audioCount++;
        }
        if (audioCount > 0) console.log(`Ingested ${audioCount} audio files.`);

        // 3. Update core/vocabulary.json and core/quotes.json
        const vocabulary = {
            updatedAt: Date.now(),
            words: (snapshot.words || []).map(w => ({
                id: w.id,
                icon: w.icon || 'star',
                next: w.next || [],
                usageCount: w.usageCount || 0,
                lastUsedAt: w.lastUsedAt || 0,
                timeBias: w.timeBias || [],
                doodle_shapes: w.doodle_shapes || w.tags || ["custom"],
                translations: w.translations || { en: w.en, ur: w.ur },
                transliterations: w.transliterations || {},
                verified: w.verified || false,
                ur: w.ur || w.translations?.ur || '',
                en: w.en || w.translations?.en || '',
                roman: w.roman || w.transliterations?.ur?.en || ''
            }))
        };
        fs.writeFileSync(path.join(DATA_DIR, 'core/vocabulary.json'), JSON.stringify(vocabulary, null, 2));

        const quotes = (snapshot.quotes || []).map((q, i) => ({
            id: q.id || `q${i}`,
            source: q.source || '',
            translations: q.translations || { en: q.en, ur: q.ur }
        }));
        fs.writeFileSync(path.join(DATA_DIR, 'core/quotes.json'), JSON.stringify(quotes, null, 2));

        // 4. Update core/doodle.json
        const doodles = snapshot.doodles || snapshot.sketches || [];
        fs.writeFileSync(path.join(DATA_DIR, 'core/doodle.json'), JSON.stringify(doodles, null, 2));

        console.log('\nSuccess! Data Universe ingested with Strict Schema.');
    } catch (err) {
        console.error('Error during ingestion:', err);
        process.exit(1);
    }
}
run();
