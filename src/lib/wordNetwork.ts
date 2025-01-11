import { universeDb } from './universeDb';

export const wordNetwork = {
  async recordUsage(wordId: string) {
    const word = await universeDb.words.get(wordId);
    if (word) {
      await universeDb.words.update(wordId, {
        usageCount: (word.usageCount || 0) + 1,
        lastUsedAt: Date.now()
      });
    }
  },

  async recordTransition(fromId: string, toId: string) {
    const fromWord = await universeDb.words.get(fromId);
    if (fromWord) {
      const next = [...(fromWord.next || [])];
      if (!next.includes(toId)) {
        next.push(toId);
        await universeDb.words.update(fromId, { next });
      }
    }
  },

  getPredictions(contextIds: string[], limit: number = 6): string[] {
    return [];
  },

  async rankPredictions(items: any[], currentSentence: any[] = []): Promise<any[]> {
    const now = Date.now();
    const hour = new Date().getHours();
    
    // Get stats from DB for these items
    const ids = items.map(i => i.id).filter(Boolean);
    const dbWords = await universeDb.words.where('id').anyOf(ids).toArray();
    const statsMap = new Map(dbWords.map(w => [w.id, w]));

    const lastWord = currentSentence[currentSentence.length - 1];

    return items.map(item => {
      const stats = statsMap.get(item.id);
      let score = 0;

      if (stats) {
        // 1. Usage Count (30%)
        score += Math.min((stats.usageCount || 0) * 0.05, 0.3);

        // 2. Recency Bonus (20%)
        if (stats.lastUsedAt) {
          const hoursSinceLastUse = (now - stats.lastUsedAt) / (1000 * 60 * 60);
          if (hoursSinceLastUse < 24) {
            score += 0.2 * (1 - hoursSinceLastUse / 24);
          }
        }

        // 3. Time of Day Bias (20%)
        if (stats.timeBias && stats.timeBias[hour]) {
          score += (stats.timeBias[hour] || 0) * 0.2;
        }

        // 4. Predictive Flow (30%)
        if (lastWord && lastWord.next && lastWord.next.includes(item.id)) {
          score += 0.3;
        }
      }

      return { ...item, rankScore: score };
    })
    .sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
  }
};
