import { MemoryEntry } from '../types';

export class VectorStore {
  private entries: Map<string, MemoryEntry> = new Map();

  add(entry: MemoryEntry): void {
    this.entries.set(entry.id, entry);
  }

  search(query: number[], topK: number = 5): MemoryEntry[] {
    const results = Array.from(this.entries.values())
      .map(entry => ({
        entry,
        similarity: this.cosineSimilarity(query, entry.vector),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(r => r.entry);

    return results;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}
