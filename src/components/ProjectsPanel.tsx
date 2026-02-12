/**
 * ProjectsPanel - Projects & Runs Management UI
 * Inspired by AgentScope Studio
 *
 * UI for managing projects and switching between them.
 */

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ProjectManager, Project, Run } from "../lib/ProjectManager";
import {
  FolderOpen,
  Plus,
  Trash2,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Folder,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function ProjectCard({
  project,
  isActive,
  onSelect,
  onDelete,
}: {
  project: Project;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const activeRuns = project.runs.filter((r) => r.status === "active").length;
  const completedRuns = project.runs.filter((r) => r.status === "completed").length;

  return (
    <div
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        isActive
          ? "bg-primary/10 border-primary/50"
          : "bg-background/30 border-border/30 hover:bg-background/50"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Folder className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
          <div>
            <h3 className="text-sm font-medium">{project.name}</h3>
            {project.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
        <span>{project.runs.length} runs</span>
        {activeRuns > 0 && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 text-blue-400">
            {activeRuns} active
          </Badge>
        )}
        {completedRuns > 0 && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 text-green-400">
            {completedRuns} done
          </Badge>
        )}
      </div>

      {isActive && (
        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
      )}
    </div>
  );
}

function RunCard({ run }: { run: Run }) {
  const statusConfig = {
    active: { icon: Zap, color: "text-blue-400", label: "Active" },
    completed: { icon: CheckCircle2, color: "text-green-400", label: "Done" },
    paused: { icon: Clock, color: "text-yellow-400", label: "Paused" },
    error: { icon: AlertCircle, color: "text-red-400", label: "Error" },
  };

  const config = statusConfig[run.status];
  const StatusIcon = config.icon;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-2.5 rounded-lg bg-background/30 border border-border/20">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">{run.name}</span>
        <div className={`flex items-center gap-1 ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span className="text-[10px]">{config.label}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1.5">{run.task}</p>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70">
        <span>{formatDate(run.createdAt)}</span>
        <span>{run.provider}</span>
        <span>{run.agentCount} agents</span>
      </div>
      {run.metrics && (
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/60">
          <span>{run.metrics.totalTokens.toLocaleString()} tokens</span>
          <span>${run.metrics.estimatedCost.toFixed(4)}</span>
        </div>
      )}
    </div>
  );
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, description: string) => void;
}

function CreateProjectDialog({ open, onOpenChange, onCreate }: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
      setName("");
      setDescription("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-sm">Create New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              className="min-h-20 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRuns, setShowRuns] = useState(true);

  useEffect(() => {
    const updateProjects = () => {
      setProjects(ProjectManager.getProjects());
      setActiveProject(ProjectManager.getActiveProject());
    };

    updateProjects();
    const unsubscribe = ProjectManager.subscribe(updateProjects);
    return unsubscribe;
  }, []);

  const handleCreateProject = (name: string, description: string) => {
    ProjectManager.createProject({ name, description });
  };

  const handleSelectProject = (projectId: string) => {
    ProjectManager.setActiveProject(projectId);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project and all its runs?")) {
      ProjectManager.deleteProject(projectId);
    }
  };

  return (
    <Card className="w-72 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Projects</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Projects List */}
        <div className="space-y-2">
          {projects.length === 0 ? (
            <div className="text-center py-4">
              <Folder className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No projects yet</p>
              <Button
                variant="link"
                size="sm"
                className="text-xs mt-1"
                onClick={() => setShowCreateDialog(true)}
              >
                Create your first project
              </Button>
            </div>
          ) : (
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={activeProject?.id === project.id}
                onSelect={() => handleSelectProject(project.id)}
                onDelete={() => handleDeleteProject(project.id)}
              />
            ))
          )}
        </div>

        {/* Runs for Active Project */}
        {activeProject && activeProject.runs.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Recent Runs</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0"
                  onClick={() => setShowRuns(!showRuns)}
                >
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${showRuns ? "rotate-90" : ""}`}
                  />
                </Button>
              </div>
              {showRuns && (
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-2">
                    {activeProject.runs.slice(0, 10).map((run) => (
                      <RunCard key={run.id} run={run} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </>
        )}

        {/* Stats */}
        {projects.length > 0 && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/30">
            <span>{projects.length} projects</span>
            <span>
              {projects.reduce((sum, p) => sum + p.runs.length, 0)} total runs
            </span>
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateProject}
      />
    </Card>
  );
}
