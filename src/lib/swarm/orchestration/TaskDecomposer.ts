import { Task } from '../types';

export class TaskDecomposer {
  decomposeBySize(task: Task, chunkSize: number): Task[] {
    return [task];
  }

  decomposeByDependency(task: Task): Task[] {
    return [task];
  }

  decomposeByComplexity(task: Task): Task[] {
    return [task];
  }

  analyze(task: Task): 'size' | 'dependency' | 'complexity' {
    return 'size';
  }
}
