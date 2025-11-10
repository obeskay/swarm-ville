import { SwarmAgent } from '../types';

export class HealthMonitor {
  private heartbeatInterval = 1000;
  private maxMissedBeats = 3;

  check(workers: Map<string, SwarmAgent>): void {
    const now = Date.now();

    workers.forEach((worker, id) => {
      const missedBeats = (now - worker.lastHeartbeat) / this.heartbeatInterval;

      if (missedBeats > this.maxMissedBeats && worker.status !== 'failed') {
        worker.status = 'stalled';
        console.warn(`[HealthMonitor] Worker ${id} stalled`);
      }
    });
  }

  recover(workerId: string, workers: Map<string, SwarmAgent>): boolean {
    const worker = workers.get(workerId);
    if (!worker) return false;

    worker.status = 'idle';
    worker.lastHeartbeat = Date.now();
    worker.currentLoad = 0;

    return true;
  }
}
