/**
 * Language System TypeScript Bindings
 * Connects to Rust backend via Tauri IPC
 */

import { invoke } from "@tauri-apps/api/core";

// ============================================
// TYPES (matching Rust structs)
// ============================================

export interface Word {
  id: string;
  word: string;
  language: string;
  category?: string;
  definition?: string;
  example_usage?: string;
  times_taught: number;
  times_used: number;
  mastery_level: number; // 0.0 to 1.0
  frequency_score: number; // 0.0 to 1.0
  first_learned_at?: number;
  last_used_at?: number;
  created_at: number;
  updated_at: number;
}

export interface WordAssociation {
  id: string;
  word_id: string;
  associated_word_id: string;
  strength: number; // 0.0 to 1.0
  association_type?: string;
  context?: string;
  co_occurrence_count: number;
  last_co_occurred_at?: number;
  created_at: number;
  updated_at: number;
}

export interface AgentLanguageState {
  agent_id: string;
  vocabulary_size: number;
  total_words_taught: number;
  total_words_used: number;
  learning_rate: number;
  auto_teach_enabled: boolean;
  preferred_language: string;
  network_state?: string; // JSON serialized
  created_at: number;
  updated_at: number;
}

export interface TeachWordRequest {
  agent_id: string;
  word: string;
  associations: string[];
  definition?: string;
  example?: string;
}

// ============================================
// LANGUAGE SYSTEM API
// ============================================

export class LanguageSystemAPI {
  /**
   * Teach a new word to an agent
   */
  async teachWord(request: TeachWordRequest): Promise<Word> {
    const requestJson = JSON.stringify(request);
    const responseJson = await invoke<string>("teach_word", {
      requestJson,
    });
    return JSON.parse(responseJson);
  }

  /**
   * Get all words known by an agent
   */
  async getAgentVocabulary(agentId: string): Promise<Word[]> {
    const responseJson = await invoke<string>("get_agent_vocabulary", {
      agentId,
    });
    return JSON.parse(responseJson);
  }

  /**
   * Get agent's learning state and stats
   */
  async getAgentLanguageState(agentId: string): Promise<AgentLanguageState> {
    const responseJson = await invoke<string>("get_agent_language_state", {
      agentId,
    });
    return JSON.parse(responseJson);
  }

  /**
   * Get associated words for a given word
   */
  async getWordAssociations(wordId: string): Promise<Array<[Word, number]>> {
    const responseJson = await invoke<string>("get_word_associations", {
      wordId,
    });
    return JSON.parse(responseJson);
  }

  /**
   * Calculate mastery progress for visualization
   */
  calculateMasteryProgress(
    vocabulary: Word[]
  ): {
    total: number;
    beginner: number; // 0.0 - 0.3
    intermediate: number; // 0.3 - 0.7
    advanced: number; // 0.7 - 1.0
    averageMastery: number;
  } {
    const total = vocabulary.length;
    let beginner = 0;
    let intermediate = 0;
    let advanced = 0;
    let totalMastery = 0;

    vocabulary.forEach((word) => {
      totalMastery += word.mastery_level;
      if (word.mastery_level < 0.3) beginner++;
      else if (word.mastery_level < 0.7) intermediate++;
      else advanced++;
    });

    return {
      total,
      beginner,
      intermediate,
      advanced,
      averageMastery: total > 0 ? totalMastery / total : 0,
    };
  }

  /**
   * Get word categories distribution
   */
  getCategoryDistribution(vocabulary: Word[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    vocabulary.forEach((word) => {
      const category = word.category || "uncategorized";
      distribution[category] = (distribution[category] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Get recently learned words (within last N days)
   */
  getRecentlyLearned(vocabulary: Word[], days: number = 7): Word[] {
    const cutoffTime = Date.now() / 1000 - days * 24 * 60 * 60;
    return vocabulary
      .filter(
        (word) =>
          word.first_learned_at && word.first_learned_at >= cutoffTime
      )
      .sort((a, b) => (b.first_learned_at || 0) - (a.first_learned_at || 0));
  }

  /**
   * Get most frequently used words
   */
  getMostUsed(vocabulary: Word[], limit: number = 10): Word[] {
    return [...vocabulary]
      .sort((a, b) => b.times_used - a.times_used)
      .slice(0, limit);
  }

  /**
   * Get words by mastery level range
   */
  getWordsByMastery(
    vocabulary: Word[],
    minMastery: number,
    maxMastery: number
  ): Word[] {
    return vocabulary.filter(
      (word) =>
        word.mastery_level >= minMastery && word.mastery_level <= maxMastery
    );
  }

  /**
   * Search words by text
   */
  searchWords(vocabulary: Word[], query: string): Word[] {
    const lowerQuery = query.toLowerCase();
    return vocabulary.filter(
      (word) =>
        word.word.toLowerCase().includes(lowerQuery) ||
        word.definition?.toLowerCase().includes(lowerQuery) ||
        word.category?.toLowerCase().includes(lowerQuery)
    );
  }
}

// Singleton instance
export const languageAPI = new LanguageSystemAPI();
