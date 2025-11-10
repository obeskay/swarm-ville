import { Task, FlowType } from '../types';

export class FlowExecutor {
  async execute(tasks: Task[], type: FlowType): Promise<any[]> {
    switch (type) {
      case 'sequential':
        return this.executeSequential(tasks);
      case 'parallel':
        return this.executeParallel(tasks);
      default:
        return this.executeSequential(tasks);
    }
  }

  private async executeSequential(tasks: Task[]): Promise<any[]> {
    const results: any[] = [];
    for (const task of tasks) {
      const result = await this.executeTask(task);
      results.push(result);
    }
    return results;
  }

  private async executeParallel(tasks: Task[]): Promise<any[]> {
    return Promise.all(tasks.map(task => this.executeTask(task)));
  }

  private async executeTask(task: Task): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ taskId: task.id, status: 'completed' });
      }, 100);
    });
  }
}
