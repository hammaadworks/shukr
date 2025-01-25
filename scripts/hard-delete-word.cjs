const fs = require('fs');
const path = require('path');

// Usage: node scripts/hard-delete-word.cjs --id=apple

const args = process.argv.slice(2);
const params = {};
args.forEach(arg => {
  const [key, value] = arg.split('=');
  if (key.startsWith('--')) {
    params[key.substring(2)] = value;
  }
});

if (!params.id) {
  console.error("Error: --id is required.");
  process.exit(1);
}

const id = params.id;
const vocabPath = path.join(__dirname, '../src/lib/data/core/vocabulary.json');
const doodlesPath = path.join(__dirname, '../src/lib/data/core/doodle.json');
const settingsPath = path.join(__dirname, '../src/lib/data/core/settings.json');
const audioDir = path.join(__dirname, '../src/lib/data/core/audio');

// 1. Remove from vocabulary.json
if (fs.existsSync(vocabPath)) {
  const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
  const wordIndex = vocab.words.findIndex(w => w.id === id);
  if (wordIndex !== -1) {
    vocab.words.splice(wordIndex, 1);
    fs.writeFileSync(vocabPath, JSON.stringify(vocab, null, 2));
    console.log(`[-] Removed '${id}' from vocabulary.json`);
  } else {
    console.warn(`Warning: Word with id '${id}' not found in vocabulary.json`);
  }
}

// 2. Remove from doodle.json
if (fs.existsSync(doodlesPath)) {
  const doodles = JSON.parse(fs.readFileSync(doodlesPath, 'utf-8'));
  const newDoodles = doodles.filter(d => d.wordId !== id && d.id !== id);
  if (doodles.length !== newDoodles.length) {
    fs.writeFileSync(doodlesPath, JSON.stringify(newDoodles, null, 2));
    console.log(`[-] Removed associated doodles for '${id}'`);
  }
}

// 3. Remove from settings.json (favorites/family)
if (fs.existsSync(settingsPath)) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  let changed = false;
  if (settings.favorites && settings.favorites.includes(id)) {
    settings.favorites = settings.favorites.filter(fid => fid !== id);
    changed = true;
  }
  if (settings.family && settings.family.includes(id)) {
    settings.family = settings.family.filter(fid => fid !== id);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`[-] Removed '${id}' from settings.json`);
  }
}

// 4. Remove associated audio files
if (fs.existsSync(audioDir)) {
  const files = fs.readdirSync(audioDir);
  let deletedAudio = 0;
  files.forEach(file => {
    // Audio keys are generated as `${voiceProfileId}_${wordId}`.
    // So they will end with `_${id}.wav`
    if (file.endsWith(`_${id}.wav`) || file === `${id}.wav` || file.includes(`_${id}_`)) {
      fs.unlinkSync(path.join(audioDir, file));
      deletedAudio++;
    }
  });
  if (deletedAudio > 0) {
    console.log(`[-] Removed ${deletedAudio} associated audio file(s) for '${id}'`);
  }
}

console.log(`\nSuccess! '${id}' has been hard-deleted from the Data Universe.`);
