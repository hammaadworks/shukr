import { universeDb } from './universeDb';
import type { WordUniverseItem } from './universeDb';

/**
 * Advanced Behavioral Predictions Engine
 * Uses Time-of-Day Context, Recency, Frequency, and Markov Chain Transitions 
 * to provide highly adaptable and intelligent word predictions.
 */
export const predictionsEngine = {
  /**
   * Records a standalone usage of a word.
   * Enhances behavioral data like Time of Day bias.
   */
  async recordUsage(wordId: string) {
    if (!wordId || wordId.startsWith('prompt_') || wordId === 'sys_yes' || wordId === 'sys_no') return;
    
    const word = await universeDb.words.get(wordId);
    if (!word) return;

    const hour = new Date().getHours();
    const timeBias = word.timeBias || new Array(24).fill(0);
    timeBias[hour] += 1;

    await universeDb.words.update(wordId, {
      usageCount: (word.usageCount || 0) + 1,
      lastUsedAt: Date.now(),
      timeBias
    });
  },

  /**
   * Records a transition from one word to another.
   * Updates the Markov chain transition matrix for contextual sentence building.
   */
  async recordTransition(fromId: string, toId: string) {
    if (!fromId || !toId || fromId.startsWith('prompt_') || toId.startsWith('prompt_')) return;
    
    const fromWord = await universeDb.words.get(fromId);
    if (!fromWord) return;

    // Use a transitions dictionary to count frequencies: { toId: count }
    const transitions: Record<string, number> = fromWord.transitions || {};
    transitions[toId] = (transitions[toId] || 0) + 1;

    // Keep legacy 'next' array updated for backwards compatibility
    const next = [...(fromWord.next || [])];
    if (!next.includes(toId)) {
      next.push(toId);
    }

    await universeDb.words.update(fromId, { 
      next, 
      transitions: transitions as any 
    });
  },

  /**
   * Ranks items using an advanced multi-factor behavioral analysis algorithm.
   */
  async rankPredictions(items: any[], currentSentence: any[] = []): Promise<any[]> {
    if (!items || items.length === 0) return [];

    const now = Date.now();
    const hour = new Date().getHours();
    
    // Fetch stats in bulk
    const ids = items.map(i => i.id).filter(Boolean);
    const dbWords = await universeDb.words.where('id').anyOf(ids).toArray();
    const statsMap = new Map<string, WordUniverseItem>(dbWords.map(w => [w.id, w]));

    const lastWordItem = currentSentence.length > 0 ? currentSentence[currentSentence.length - 1] : null;
    let lastWordStats: any = null;
    if (lastWordItem) {
      lastWordStats = await universeDb.words.get(lastWordItem.id);
    }

    const ranked = items.map(item => {
      const stats = statsMap.get(item.id);
      let score = 0;

      if (stats) {
        // 1. Base Usage Frequency (Max ~20 points)
        // Logarithmic scale so highly used words don't permanently dominate new behaviors
        const usage = stats.usageCount || 0;
        score += usage > 0 ? Math.min(Math.log10(usage + 1) * 5, 20) : 0;

        // 2. Recency Decay (Max 25 points)
        // Words used in the last 2 hours get a huge boost, decaying over 48 hours
        if (stats.lastUsedAt) {
          const hoursSince = (now - stats.lastUsedAt) / (1000 * 60 * 60);
          if (hoursSince < 2) {
             score += 25; // Immediate context continuation
          } else if (hoursSince < 48) {
             score += 15 * (1 - (hoursSince / 48)); 
          }
        }

        // 3. Time of Day Bias (Max 20 points)
        // If this word is frequently used around this hour (±1 hour smoothing)
        if (stats.timeBias) {
          const currentHourBias = stats.timeBias[hour] || 0;
          const prevHourBias = stats.timeBias[(hour - 1 + 24) % 24] || 0;
          const nextHourBias = stats.timeBias[(hour + 1) % 24] || 0;
          
          const contextualTimeScore = currentHourBias + (prevHourBias * 0.5) + (nextHourBias * 0.5);
          score += Math.min(contextualTimeScore * 2, 20);
        }

        // 4. Markov Chain Transition Probability (Max 50 points)
        // If this word historically follows the last spoken word
        if (lastWordStats) {
           const transitions = lastWordStats.transitions || {};
           const transitionFreq = transitions[item.id] || 0;
           
           if (transitionFreq > 0) {
              // Calculate relative probability (0.0 to 1.0)
              const totalTransitions = Object.values(transitions).reduce((sum: any, val: any) => sum + val, 0) as number;
              const probability = transitionFreq / (totalTransitions || 1);
              
              score += 10 + (probability * 40); // Base 10 just for existing, up to +40 based on confidence
           } else if (lastWordStats.next && lastWordStats.next.includes(item.id)) {
              // Fallback to legacy 'next' array
              score += 15;
           }
        }
      }

      return { ...item, rankScore: score };
    });

    // Sort by rankScore descending
    ranked.sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));

    // If we are mid-sentence, optionally filter out completely irrelevant words 
    // to keep the prediction bar focused on actual predictions.
    // We only return words that have some score > 0.
    if (currentSentence.length > 0) {
      return ranked.filter(r => r.rankScore > 0);
    }

    return ranked;
  }
};
