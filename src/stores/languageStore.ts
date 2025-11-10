/**
 * Language System Store
 * Manages vocabulary, learning state, and word associations
 */

import { create } from "zustand";
import {
  languageAPI,
  type Word,
  type AgentLanguageState,
  type TeachWordRequest,
} from "@/lib/db/language";

interface LanguageStore {
  // State
  currentAgentId: string | null;
  vocabulary: Word[];
  languageState: AgentLanguageState | null;
  associations: Map<string, Array<[Word, number]>>; // wordId -> [(word, strength)]
  loading: boolean;
  error: string | null;

  // Filter/Search state
  searchQuery: string;
  categoryFilter: string | null;
  masteryFilter: { min: number; max: number } | null;

  // Actions
  setCurrentAgent: (agentId: string) => Promise<void>;
  loadVocabulary: (agentId: string) => Promise<void>;
  loadLanguageState: (agentId: string) => Promise<void>;
  teachWord: (request: TeachWordRequest) => Promise<Word>;
  loadAssociations: (wordId: string) => Promise<void>;
  refreshAll: () => Promise<void>;

  // Filter/Search actions
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  setMasteryFilter: (min: number, max: number) => void;
  clearFilters: () => void;

  // Computed getters
  getFilteredVocabulary: () => Word[];
  getMasteryProgress: () => {
    total: number;
    beginner: number;
    intermediate: number;
    advanced: number;
    averageMastery: number;
  };
  getCategoryDistribution: () => Record<string, number>;
  getRecentlyLearned: (days?: number) => Word[];
  getMostUsed: (limit?: number) => Word[];
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  // Initial state
  currentAgentId: null,
  vocabulary: [],
  languageState: null,
  associations: new Map(),
  loading: false,
  error: null,

  searchQuery: "",
  categoryFilter: null,
  masteryFilter: null,

  // Actions
  setCurrentAgent: async (agentId: string) => {
    set({ currentAgentId: agentId, loading: true, error: null });
    try {
      await Promise.all([
        get().loadVocabulary(agentId),
        get().loadLanguageState(agentId),
      ]);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      });
    }
  },

  loadVocabulary: async (agentId: string) => {
    set({ loading: true, error: null });
    try {
      const vocabulary = await languageAPI.getAgentVocabulary(agentId);
      set({ vocabulary, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load vocabulary",
        loading: false,
      });
      throw error;
    }
  },

  loadLanguageState: async (agentId: string) => {
    set({ loading: true, error: null });
    try {
      const languageState = await languageAPI.getAgentLanguageState(agentId);
      set({ languageState, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load language state",
        loading: false,
      });
      throw error;
    }
  },

  teachWord: async (request: TeachWordRequest) => {
    set({ loading: true, error: null });
    try {
      const word = await languageAPI.teachWord(request);

      // Refresh vocabulary and state
      await Promise.all([
        get().loadVocabulary(request.agent_id),
        get().loadLanguageState(request.agent_id),
      ]);

      set({ loading: false });
      return word;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to teach word",
        loading: false,
      });
      throw error;
    }
  },

  loadAssociations: async (wordId: string) => {
    try {
      const associationsList = await languageAPI.getWordAssociations(wordId);
      const { associations } = get();
      associations.set(wordId, associationsList);
      set({ associations: new Map(associations) });
    } catch (error) {
      console.error("Failed to load associations:", error);
      throw error;
    }
  },

  refreshAll: async () => {
    const { currentAgentId } = get();
    if (!currentAgentId) return;

    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().loadVocabulary(currentAgentId),
        get().loadLanguageState(currentAgentId),
      ]);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to refresh",
        loading: false,
      });
    }
  },

  // Filter/Search actions
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setCategoryFilter: (category: string | null) => set({ categoryFilter: category }),

  setMasteryFilter: (min: number, max: number) =>
    set({ masteryFilter: { min, max } }),

  clearFilters: () =>
    set({ searchQuery: "", categoryFilter: null, masteryFilter: null }),

  // Computed getters
  getFilteredVocabulary: () => {
    const { vocabulary, searchQuery, categoryFilter, masteryFilter } = get();
    let filtered = [...vocabulary];

    // Apply search
    if (searchQuery) {
      filtered = languageAPI.searchWords(filtered, searchQuery);
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((word) => word.category === categoryFilter);
    }

    // Apply mastery filter
    if (masteryFilter) {
      filtered = languageAPI.getWordsByMastery(
        filtered,
        masteryFilter.min,
        masteryFilter.max
      );
    }

    return filtered;
  },

  getMasteryProgress: () => {
    const { vocabulary } = get();
    return languageAPI.calculateMasteryProgress(vocabulary);
  },

  getCategoryDistribution: () => {
    const { vocabulary } = get();
    return languageAPI.getCategoryDistribution(vocabulary);
  },

  getRecentlyLearned: (days = 7) => {
    const { vocabulary } = get();
    return languageAPI.getRecentlyLearned(vocabulary, days);
  },

  getMostUsed: (limit = 10) => {
    const { vocabulary } = get();
    return languageAPI.getMostUsed(vocabulary, limit);
  },
}));
