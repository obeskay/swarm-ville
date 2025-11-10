import { SwarmAgent, Task, SwarmState } from '../types';
import { LoadBalancer } from './LoadBalancer';
import { HealthMonitor } from './HealthMonitor';
import { TaskDecomposer } from './TaskDecomposer';

export class QueenAgent {
  private state: SwarmState;
  private loadBalancer: LoadBalancer;
  private healthMonitor: HealthMonitor;
  private decomposer: TaskDecomposer;

  constructor(queenId: string) {
    this.state = {
      queenId,
      workers: new Map(),
      activeTasks: new Map(),
      memory: [],
    };
    this.loadBalancer = new LoadBalancer();
    this.healthMonitor = new HealthMonitor();
    this.decomposer = new TaskDecomposer();
  }

  registerWorker(worker: SwarmAgent): void {
    this.state.workers.set(worker.id, worker);
  }

  assignTask(task: Task): string | null {
    const workerId = this.loadBalancer.assign(task, this.state.workers);
    if (!workerId) return null;

    this.state.activeTasks.set(task.id, task);
    const worker = this.state.workers.get(workerId);
    if (worker) {
      worker.currentLoad++;
      worker.status = 'working';
    }

    return workerId;
  }

  monitorHealth(): void {
    this.healthMonitor.check(this.state.workers);
  }

  getState(): SwarmState {
    return this.state;
  }
}
