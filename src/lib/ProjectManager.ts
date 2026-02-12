/**
 * ProjectManager - Projects & Runs System
 * Inspired by AgentScope Studio
 *
 * Manages projects with multiple runs for organizing agent sessions.
 */

export interface Run {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  completedAt?: number;
  status: "active" | "completed" | "paused" | "error";
  task: string;
  provider: string;
  agentCount: number;
  metrics?: RunMetrics;
}

export interface RunMetrics {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  totalDuration: number; // in milliseconds
  agentMetrics: Record<string, AgentMetrics>;
}

export interface AgentMetrics {
  messages: number;
  tokens: number;
  duration: number;
  status: "working" | "completed" | "error";
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  runs: Run[];
  tags: string[];
  settings: ProjectSettings;
}

export interface ProjectSettings {
  defaultProvider: string;
  defaultAgentCount: number;
  autoSave: boolean;
  notifications: boolean;
}

export interface CreateProjectOptions {
  name: string;
  description?: string;
  tags?: string[];
}

export interface CreateRunOptions {
  name?: string;
  description?: string;
  task: string;
  provider: string;
  agentCount: number;
}

const STORAGE_KEY = "swarmville_projects";
const ACTIVE_PROJECT_KEY = "swarmville_active_project";

class ProjectManagerClass {
  private projects: Map<string, Project> = new Map();
  private activeProjectId: string | null = null;
  private currentRunId: string | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Project[];
        data.forEach((project) => {
          this.projects.set(project.id, project);
        });
      }

      const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
      if (activeId && this.projects.has(activeId)) {
        this.activeProjectId = activeId;
      } else if (this.projects.size > 0) {
        // Default to most recent project
        const sorted = Array.from(this.projects.values()).sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
        this.activeProjectId = sorted[0].id;
      }
    } catch (error) {
      console.error("[ProjectManager] Failed to load from storage:", error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.projects.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (this.activeProjectId) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, this.activeProjectId);
      }
    } catch (error) {
      console.error("[ProjectManager] Failed to save to storage:", error);
    }
  }

  // Generate unique IDs
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Create a new project
  createProject(options: CreateProjectOptions): Project {
    const id = this.generateId();
    const now = Date.now();

    const project: Project = {
      id,
      name: options.name,
      description: options.description,
      createdAt: now,
      updatedAt: now,
      runs: [],
      tags: options.tags || [],
      settings: {
        defaultProvider: "auto",
        defaultAgentCount: 4,
        autoSave: true,
        notifications: true,
      },
    };

    this.projects.set(id, project);
    this.activeProjectId = id;
    this.saveToStorage();
    this.notify();

    console.log(`[ProjectManager] Created project: ${project.name}`);
    return project;
  }

  // Get all projects
  getProjects(): Project[] {
    return Array.from(this.projects.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Get active project
  getActiveProject(): Project | null {
    if (!this.activeProjectId) return null;
    return this.projects.get(this.activeProjectId) || null;
  }

  // Set active project
  setActiveProject(projectId: string): boolean {
    if (!this.projects.has(projectId)) return false;
    this.activeProjectId = projectId;
    this.currentRunId = null;
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
    this.notify();
    return true;
  }

  // Get project by ID
  getProject(projectId: string): Project | null {
    return this.projects.get(projectId) || null;
  }

  // Update project
  updateProject(projectId: string, updates: Partial<Project>): Project | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    Object.assign(project, updates, { updatedAt: Date.now() });
    this.saveToStorage();
    this.notify();
    return project;
  }

  // Delete project
  deleteProject(projectId: string): boolean {
    if (!this.projects.has(projectId)) return false;

    this.projects.delete(projectId);

    if (this.activeProjectId === projectId) {
      this.activeProjectId = this.projects.size > 0
        ? Array.from(this.projects.values())[0].id
        : null;
      this.currentRunId = null;
    }

    this.saveToStorage();
    this.notify();
    return true;
  }

  // Create a new run in the active project
  createRun(options: CreateRunOptions): Run | null {
    const project = this.getActiveProject();
    if (!project) {
      console.error("[ProjectManager] No active project");
      return null;
    }

    const id = this.generateId();
    const run: Run = {
      id,
      name: options.name || `Run ${project.runs.length + 1}`,
      description: options.description,
      createdAt: Date.now(),
      status: "active",
      task: options.task,
      provider: options.provider,
      agentCount: options.agentCount,
      metrics: {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: 0,
        totalDuration: 0,
        agentMetrics: {},
      },
    };

    project.runs.unshift(run);
    project.updatedAt = Date.now();
    this.currentRunId = id;

    this.saveToStorage();
    this.notify();

    console.log(`[ProjectManager] Created run: ${run.name}`);
    return run;
  }

  // Get current run
  getCurrentRun(): Run | null {
    const project = this.getActiveProject();
    if (!project || !this.currentRunId) return null;
    return project.runs.find((r) => r.id === this.currentRunId) || null;
  }

  // Get run by ID
  getRun(projectId: string, runId: string): Run | null {
    const project = this.projects.get(projectId);
    if (!project) return null;
    return project.runs.find((r) => r.id === runId) || null;
  }

  // Update run
  updateRun(projectId: string, runId: string, updates: Partial<Run>): Run | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const run = project.runs.find((r) => r.id === runId);
    if (!run) return null;

    Object.assign(run, updates);
    project.updatedAt = Date.now();

    this.saveToStorage();
    this.notify();
    return run;
  }

  // Update current run metrics
  updateCurrentRunMetrics(agentId: string, metrics: Partial<AgentMetrics>): void {
    const project = this.getActiveProject();
    if (!project || !this.currentRunId) return;

    const run = project.runs.find((r) => r.id === this.currentRunId);
    if (!run || !run.metrics) return;

    // Update agent metrics
    const existing = run.metrics.agentMetrics[agentId] || {
      messages: 0,
      tokens: 0,
      duration: 0,
      status: "working" as const,
    };

    run.metrics.agentMetrics[agentId] = {
      ...existing,
      ...metrics,
    };

    // Recalculate totals
    run.metrics.totalTokens = Object.values(run.metrics.agentMetrics)
      .reduce((sum, m) => sum + m.tokens, 0);

    // Estimate cost (rough approximation: $0.003/1K input, $0.015/1K output)
    run.metrics.estimatedCost = (run.metrics.totalTokens / 1000) * 0.009;

    this.saveToStorage();
    this.notify();
  }

  // Complete current run
  completeCurrentRun(status: "completed" | "error" = "completed"): void {
    const project = this.getActiveProject();
    if (!project || !this.currentRunId) return;

    const run = project.runs.find((r) => r.id === this.currentRunId);
    if (!run) return;

    run.status = status;
    run.completedAt = Date.now();
    project.updatedAt = Date.now();

    this.saveToStorage();
    this.notify();
  }

  // Delete run
  deleteRun(projectId: string, runId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const index = project.runs.findIndex((r) => r.id === runId);
    if (index === -1) return false;

    project.runs.splice(index, 1);
    project.updatedAt = Date.now();

    if (this.currentRunId === runId) {
      this.currentRunId = null;
    }

    this.saveToStorage();
    this.notify();
    return true;
  }

  // Get run history for active project
  getRunHistory(): Run[] {
    const project = this.getActiveProject();
    if (!project) return [];
    return project.runs;
  }

  // Get statistics
  getStatistics(): {
    totalProjects: number;
    totalRuns: number;
    totalTokens: number;
    totalCost: number;
  } {
    let totalRuns = 0;
    let totalTokens = 0;
    let totalCost = 0;

    this.projects.forEach((project) => {
      totalRuns += project.runs.length;
      project.runs.forEach((run) => {
        if (run.metrics) {
          totalTokens += run.metrics.totalTokens;
          totalCost += run.metrics.estimatedCost;
        }
      });
    });

    return {
      totalProjects: this.projects.size,
      totalRuns,
      totalTokens,
      totalCost,
    };
  }
}

// Export singleton instance
export const ProjectManager = new ProjectManagerClass();
