import { SwarmAgent, Task } from '../types';

export class LoadBalancer {
  assign(task: Task, workers: Map<string, SwarmAgent>): string | null {
    const available = Array.from(workers.values())
      .filter(w => w.status === 'idle' || w.currentLoad < w.maxLoad)
      .sort((a, b) => a.currentLoad - b.currentLoad);

    if (available.length === 0) return null;

    const worker = available[0];
    return worker.id;
  }

  rebalance(workers: Map<string, SwarmAgent>, tasks: Map<string, Task>): void {
    const overloaded = Array.from(workers.values()).filter(w => w.currentLoad > w.maxLoad * 0.8);
    const underloaded = Array.from(workers.values()).filter(w => w.currentLoad < w.maxLoad * 0.5);

    if (overloaded.length > 0 && underloaded.length > 0) {
      console.log('[LoadBalancer] Rebalancing needed');
    }
  }
}
