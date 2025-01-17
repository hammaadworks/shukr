import { db } from './db';
import type { SketchRecognitionMode, Stroke, StrokePoint } from './db';
import { normalizeStrokes, resampleStroke } from './utils';
import { universeDb } from '../lib/universeDb';
import Fuse from 'fuse.js';

export interface RecognitionResult {
  id: string;
  label: string;
  ur: string;
  en: string;
  confidence: number;
  type: 'digit' | 'letter' | 'urdu' | 'need' | 'contact' | 'custom' | 'word';
  icon?: string;
}

class TemplateMatcher {
  private templates: { id: string; label: string; points: StrokePoint[]; type: any; en: string; ur: string }[] = [];

  addTemplate(id: string, label: string, strokes: Stroke[], type: any, en: string, ur: string) {
    const points = strokes.flat();
    this.templates.push({ id, label, points: resampleStroke(points), type, en, ur });
  }

  recognize(strokes: Stroke[]): any[] {
    if (strokes.length === 0) return [];
    const inputPoints = resampleStroke(strokes.flat());
    
    return this.templates.map(tpl => {
      const distance = this.pathDistance(inputPoints, tpl.points);
      const score = Math.max(0, 1 - distance / (0.5 * Math.sqrt(100 * 100 + 100 * 100)));
      return { 
        id: tpl.id,
        label: tpl.label, 
        en: tpl.en, 
        ur: tpl.ur, 
        confidence: score, 
        type: tpl.type 
      };
    }).filter(r => r.confidence > 0.55);
  }

  private pathDistance(pts1: StrokePoint[], pts2: StrokePoint[]): number {
    let d = 0;
    const len = Math.min(pts1.length, pts2.length);
    for (let i = 0; i < len; i++) {
      d += Math.sqrt(Math.pow(pts1[i].x - pts2[i].x, 2) + Math.pow(pts1[i].y - pts2[i].y, 2));
    }
    return d / len;
  }
}

export const recognitionEngine = {
  matcher: new TemplateMatcher(),
  fuse: null as Fuse<any> | null,

  async init(_config: any) {
    // 1. Seed geometric templates for tags
    this.seedGeometricTemplates();

    // 2. Load user templates
    const userTemplates = await db.templates.toArray();
    userTemplates.forEach(t => {
      this.matcher.addTemplate(t.id, t.label, t.strokes, t.category === 'contacts' ? 'contact' : 'custom', t.en, t.ur);
    });

    // 3. Initialize Fuse for Word Universe
    const allWords = await universeDb.words.toArray();
    this.fuse = new Fuse(allWords, {
      keys: [
        { name: 'tags', weight: 1.0 },
        { name: 'en', weight: 0.3 },
        { name: 'ur', weight: 0.3 },
        { name: 'roman', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true
    });
  },

  seedGeometricTemplates() {
    // Circle (Swelling, Redness, Food, Clock)
    const circle: StrokePoint[] = [];
    for (let i = 0; i <= 32; i++) {
      const t = (i / 32) * Math.PI * 2;
      circle.push({ x: 50 + 40 * Math.cos(t), y: 50 + 40 * Math.sin(t) });
    }
    this.matcher.addTemplate('circle_tpl', 'circle', [circle], 'custom', 'Circle', 'دائرہ');

    // Zigzag (Pain, Itching, Burning, Cold)
    const zigzag: StrokePoint[] = [
      {x:10,y:10}, {x:90,y:30}, {x:10,y:50}, {x:90,y:70}, {x:10,y:90}
    ];
    this.matcher.addTemplate('zigzag_tpl', 'zigzag', [zigzag], 'custom', 'Sharp', 'تیز');

    // Wave (Water, Cream, Burning)
    const wave: StrokePoint[] = [];
    for (let i = 0; i <= 20; i++) {
      wave.push({ x: i * 5, y: 50 + 20 * Math.sin(i * 0.5) });
    }
    this.matcher.addTemplate('wave_tpl', 'wave', [wave], 'custom', 'Wave', 'لہر');

    // Basic Letters for "Writing" support
    this.matcher.addTemplate('char_a', 'a', [[{x:50,y:10}, {x:10,y:90}, {x:90,y:90}, {x:50,y:10}]], 'letter', 'A', 'اے');
    this.matcher.addTemplate('char_o', 'o', [circle], 'letter', 'O', 'او');
    this.matcher.addTemplate('char_i', 'i', [[{x:50,y:10}, {x:50,y:90}]], 'letter', 'I', 'آئی');
    this.matcher.addTemplate('char_l', 'l', [[{x:20,y:10}, {x:20,y:90}, {x:80,y:90}]], 'letter', 'L', 'ایل');
    this.matcher.addTemplate('char_v', 'v', [[{x:10,y:10}, {x:50,y:90}, {x:90,y:10}]], 'letter', 'V', 'وی');
    this.matcher.addTemplate('char_x', 'x', [[{x:10,y:10}, {x:90,y:90}], [{x:90,y:10}, {x:10,y:90}]], 'letter', 'X', 'ایکس');
    this.matcher.addTemplate('char_f', 'f', [[{x:80,y:10}, {x:20,y:10}, {x:20,y:90}], [{x:10,y:50}, {x:40,y:50}]], 'letter', 'F', 'ایف');
    this.matcher.addTemplate('char_p', 'p', [[{x:20,y:90}, {x:20,y:10}, {x:80,y:10}, {x:80,y:50}, {x:20,y:50}]], 'letter', 'P', 'پی');
    this.matcher.addTemplate('char_e', 'e', [[{x:80,y:10}, {x:20,y:10}, {x:20,y:90}, {x:80,y:90}], [{x:20,y:50}, {x:60,y:50}]], 'letter', 'E', 'ای');
    this.matcher.addTemplate('char_t', 't', [[{x:10,y:10}, {x:90,y:10}], [{x:50,y:10}, {x:50,y:90}]], 'letter', 'T', 'ٹی');
    this.matcher.addTemplate('char_u', 'u', [[{x:10,y:10}, {x:10,y:80}, {x:50,y:95}, {x:90,y:80}, {x:90,y:10}]], 'letter', 'U', 'یو');
    this.matcher.addTemplate('char_m', 'm', [[{x:10,y:90}, {x:10,y:10}, {x:50,y:50}, {x:90,y:10}, {x:90,y:90}]], 'letter', 'M', 'ایم');
    this.matcher.addTemplate('char_n', 'n', [[{x:10,y:90}, {x:10,y:10}, {x:90,y:90}, {x:90,y:10}]], 'letter', 'N', 'این');
    this.matcher.addTemplate('char_s', 's', [[{x:80,y:20}, {x:20,y:20}, {x:20,y:50}, {x:80,y:50}, {x:80,y:80}, {x:20,y:80}]], 'letter', 'S', 'ایس');
    this.matcher.addTemplate('char_b', 'b', [[{x:20,y:10}, {x:20,y:90}], [{x:20,y:10}, {x:70,y:10}, {x:70,y:50}, {x:20,y:50}, {x:80,y:50}, {x:80,y:90}, {x:20,y:90}]], 'letter', 'B', 'بی');
    this.matcher.addTemplate('char_c', 'c', [[{x:80,y:20}, {x:20,y:20}, {x:20,y:80}, {x:80,y:80}]], 'letter', 'C', 'سی');
    this.matcher.addTemplate('char_d', 'd', [[{x:20,y:10}, {x:20,y:90}], [{x:20,y:10}, {x:80,y:50}, {x:20,y:90}]], 'letter', 'D', 'ڈی');
    this.matcher.addTemplate('char_g', 'g', [[{x:80,y:20}, {x:20,y:20}, {x:20,y:80}, {x:80,y:80}, {x:80,y:50}, {x:50,y:50}]], 'letter', 'G', 'جی');
    this.matcher.addTemplate('char_h', 'h', [[{x:20,y:10}, {x:20,y:90}], [{x:80,y:10}, {x:80,y:90}], [{x:20,y:50}, {x:80,y:50}]], 'letter', 'H', 'ایچ');
    this.matcher.addTemplate('char_j', 'j', [[{x:10,y:10}, {x:90,y:10}], [{x:50,y:10}, {x:50,y:80}, {x:20,y:80}]], 'letter', 'J', 'جے');
    this.matcher.addTemplate('char_k', 'k', [[{x:20,y:10}, {x:20,y:90}], [{x:80,y:10}, {x:20,y:50}, {x:80,y:90}]], 'letter', 'K', 'کے');
    this.matcher.addTemplate('char_r', 'r', [[{x:20,y:90}, {x:20,y:10}, {x:80,y:10}, {x:80,y:50}, {x:20,y:50}, {x:80,y:90}]], 'letter', 'R', 'آر');
    this.matcher.addTemplate('char_w', 'w', [[{x:10,y:10}, {x:30,y:90}, {x:50,y:30}, {x:70,y:90}, {x:90,y:10}]], 'letter', 'W', 'ڈبلیو');
    this.matcher.addTemplate('char_y', 'y', [[{x:10,y:10}, {x:50,y:50}, {x:90,y:10}], [{x:50,y:50}, {x:50,y:90}]], 'letter', 'Y', 'وائے');
    this.matcher.addTemplate('char_z', 'z', [[{x:10,y:10}, {x:90,y:10}, {x:10,y:90}, {x:90,y:90}]], 'letter', 'Z', 'زیڈ');
  },

  async recognize(strokes: Stroke[], _mode: SketchRecognitionMode, _config: any): Promise<RecognitionResult[]> {
    const normalized = normalizeStrokes(strokes);
    const templateMatches = this.matcher.recognize(normalized);
    
    const sortedTpls = templateMatches.sort((a, b) => b.confidence - a.confidence);
    const topTpl = sortedTpls[0];

    let universeMatches: any[] = [];
    if (this.fuse && topTpl) {
      // 1. Search by Tag
      const tagMatches = this.fuse.search(topTpl.label).map(res => ({
        id: res.item.id,
        label: res.item.en,
        en: res.item.en,
        ur: res.item.ur,
        confidence: topTpl.confidence * (1 - (res.score || 0)),
        type: 'word' as const,
        icon: res.item.icon
      }));

      // 2. Search by Letter Prefix (Writing support)
      let prefixMatches: any[] = [];
      if (topTpl.label.length === 1) {
        // Find words starting with this letter
        prefixMatches = this.fuse.search(`^${topTpl.label}`).map(res => ({
          id: res.item.id,
          label: res.item.en,
          en: res.item.en,
          ur: res.item.ur,
          confidence: topTpl.confidence * 0.9,
          type: 'word' as const,
          icon: res.item.icon
        }));
      }

      universeMatches = [...tagMatches, ...prefixMatches];
    }

    // Add literal character as a suggestion if it's a letter
    const literalChars = sortedTpls
      .filter(t => t.type === 'letter')
      .map(t => ({
        id: `char_${t.label}`,
        label: t.label.toUpperCase(),
        en: t.label.toUpperCase(),
        ur: t.ur,
        confidence: t.confidence + 0.5, // Boost literal characters
        type: 'letter' as const
      }));

    const combined = [...literalChars, ...templateMatches, ...universeMatches];

    // Rule of 16: Ensure we provide up to 16 suggestions
    const unique = combined
      .sort((a, b) => b.confidence - a.confidence)
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    
    // If we have fewer than 16, pad with related words from the universe search
    if (unique.length < 16 && this.fuse) {
      const moreWords = this.fuse.search('core')
        .slice(0, 16 - unique.length)
        .map(res => ({
          id: res.item.id,
          label: res.item.en,
          en: res.item.en,
          ur: res.item.ur,
          confidence: 0.1, 
          type: 'word' as const,
          icon: res.item.icon
        }));
      unique.push(...moreWords);
    }

    return unique.slice(0, 16) as RecognitionResult[];
  },

  async train(label: string, en: string, ur: string, strokes: Stroke[], _mode: SketchRecognitionMode) {
    const normalized = normalizeStrokes(strokes);
    const id = `tpl_${crypto.randomUUID()}`;
    // The "en" here is effectively our language-agnostic semantic wordId
    const wordId = en.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .trim();

    await db.templates.add({
      id,
      wordId,
      label,
      en,
      ur,
      category: _mode,
      strokes: normalized,
      createdAt: Date.now()
    });
    this.matcher.addTemplate(id, label, normalized, _mode === 'contacts' ? 'contact' : 'custom', en, ur);
  }
};
