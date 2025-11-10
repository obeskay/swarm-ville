/**
 * Agent metrics tracking for observability
 * Tracks token usage, costs, and performance
 */

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalTokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  totalCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  estimatedCost: number;
  lastActive: number;
}

export interface CallMetrics {
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

class AgentMetricsService {
  private metrics = new Map<string, AgentMetrics>();
  private callHistory = new Map<string, CallMetrics[]>();
  private listeners = new Set<(metrics: Map<string, AgentMetrics>) => void>();

  // Pricing per 1M tokens (Claude Sonnet 3.5)
  private readonly PRICE_INPUT = 3.0; // $3 per 1M input tokens
  private readonly PRICE_OUTPUT = 15.0; // $15 per 1M output tokens

  initAgent(agentId: string, agentName: string) {
    if (!this.metrics.has(agentId)) {
      this.metrics.set(agentId, {
        agentId,
        agentName,
        totalTokensUsed: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCalls: 0,
        failedCalls: 0,
        avgResponseTime: 0,
        estimatedCost: 0,
        lastActive: Date.now(),
      });
      this.callHistory.set(agentId, []);
      this.notifyListeners();
    }
  }

  recordCall(
    agentId: string,
    inputTokens: number,
    outputTokens: number,
    responseTime: number,
    success: boolean,
    error?: string
  ) {
    const metrics = this.metrics.get(agentId);
    if (!metrics) {
      console.warn(`[Metrics] Agent ${agentId} not initialized`);
      return;
    }

    // Update metrics
    metrics.inputTokens += inputTokens;
    metrics.outputTokens += outputTokens;
    metrics.totalTokensUsed += inputTokens + outputTokens;
    metrics.totalCalls++;
    if (!success) metrics.failedCalls++;
    metrics.lastActive = Date.now();

    // Calculate average response time
    const history = this.callHistory.get(agentId) || [];
    const totalResponseTime =
      history.reduce((sum, call) => sum + call.responseTime, 0) + responseTime;
    metrics.avgResponseTime = totalResponseTime / (history.length + 1);

    // Calculate estimated cost
    metrics.estimatedCost =
      (metrics.inputTokens / 1_000_000) * this.PRICE_INPUT +
      (metrics.outputTokens / 1_000_000) * this.PRICE_OUTPUT;

    // Add to history
    history.push({
      timestamp: Date.now(),
      inputTokens,
      outputTokens,
      responseTime,
      success,
      error,
    });

    // Keep last 100 calls
    if (history.length > 100) {
      history.shift();
    }

    this.metrics.set(agentId, metrics);
    this.callHistory.set(agentId, history);
    this.notifyListeners();
  }

  getMetrics(agentId: string): AgentMetrics | undefined {
    return this.metrics.get(agentId);
  }

  getAllMetrics(): AgentMetrics[] {
    return Array.from(this.metrics.values());
  }

  getCallHistory(agentId: string): CallMetrics[] {
    return this.callHistory.get(agentId) || [];
  }

  getTotalCost(): number {
    return Array.from(this.metrics.values()).reduce((sum, m) => sum + m.estimatedCost, 0);
  }

  getTotalTokens(): number {
    return Array.from(this.metrics.values()).reduce((sum, m) => sum + m.totalTokensUsed, 0);
  }

  subscribe(listener: (metrics: Map<string, AgentMetrics>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.metrics));
  }

  reset(agentId?: string) {
    if (agentId) {
      this.metrics.delete(agentId);
      this.callHistory.delete(agentId);
    } else {
      this.metrics.clear();
      this.callHistory.clear();
    }
    this.notifyListeners();
  }

  exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      totalCost: this.getTotalCost(),
      totalTokens: this.getTotalTokens(),
      agents: this.getAllMetrics(),
    };
    return JSON.stringify(data, null, 2);
  }
}

export const agentMetrics = new AgentMetricsService();
