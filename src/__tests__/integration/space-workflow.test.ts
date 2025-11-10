import { describe, it, expect, beforeEach } from "vitest";
import { useSpaceStore } from "../../stores/spaceStore";
import { renderHook, act } from "@testing-library/react";
import type { Space, Agent } from "../../lib/types";

// Helper to create mock space
const createMockSpace = (id: string, name: string, width: number, height: number): Space => ({
  id,
  name,
  ownerId: "test-user",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  dimensions: { width, height },
  tileset: { floor: "default", theme: "modern" },
  agents: [],
  settings: { proximityRadius: 5, maxAgents: 10, snapToGrid: true },
});

// Helper to create mock agent
const createMockAgent = (
  id: string,
  name: string,
  spaceId: string,
  role: string = "coder"
): Agent => ({
  id,
  name,
  spaceId,
  ownerId: "test-user",
  createdAt: Date.now(),
  position: { x: 10, y: 10 },
  role: role as any,
  model: { provider: "claude", modelName: "claude-3-sonnet", useUserCLI: false },
  avatar: { icon: "🤖", color: "#3B82F6" },
  state: "idle",
});

describe("Space Workflow - Integration Tests", () => {
  beforeEach(() => {
    // Reset store before each test
    useSpaceStore.setState({
      spaces: [],
      currentSpaceId: null,
      agents: new Map(),
      userPosition: { x: 25, y: 25 },
    });
  });

  it("should complete full workflow: create space -> add agents -> move -> interact", () => {
    const { result } = renderHook(() => useSpaceStore());

    // Step 1: Create a space
    const mockSpace = createMockSpace("workflow-space", "Workflow Test Space", 100, 100);

    act(() => {
      result.current.addSpace(mockSpace);
    });

    expect(result.current.spaces).toHaveLength(1);

    // Step 2: Set as current space
    act(() => {
      result.current.setCurrentSpace("workflow-space");
    });

    expect(result.current.currentSpaceId).toBe("workflow-space");

    // Step 3: Add multiple agents
    act(() => {
      for (let i = 0; i < 3; i++) {
        const agent = createMockAgent(`workflow-agent-${i}`, `Workflow Bot ${i}`, "workflow-space");
        agent.position = { x: 10 + i * 20, y: 10 };
        result.current.addAgent("workflow-space", agent);
      }
    });

    expect(result.current.agents.size).toBe(3);

    // Step 4: Move user position
    act(() => {
      result.current.setUserPosition({ x: 50, y: 50 });
    });

    expect(result.current.userPosition).toEqual({ x: 50, y: 50 });

    // Step 5: Update agent position
    act(() => {
      result.current.updateAgent("workflow-agent-0", { position: { x: 55, y: 55 } });
    });

    const movedAgent = result.current.agents.get("workflow-agent-0");
    expect(movedAgent?.position).toEqual({ x: 55, y: 55 });

    // Step 6: Update agent state
    act(() => {
      result.current.updateAgent("workflow-agent-1", { state: "speaking" });
    });

    const speakingAgent = result.current.agents.get("workflow-agent-1");
    expect(speakingAgent?.state).toBe("speaking");
  });

  it("should handle space with many agents", () => {
    const { result } = renderHook(() => useSpaceStore());

    const mockSpace = createMockSpace("large-space", "Large Test Space", 200, 200);

    act(() => {
      result.current.addSpace(mockSpace);
      result.current.setCurrentSpace("large-space");
    });

    // Add 10 agents
    act(() => {
      for (let i = 0; i < 10; i++) {
        const agent = createMockAgent(`agent-${i}`, `Bot ${i}`, "large-space");
        result.current.addAgent("large-space", agent);
      }
    });

    expect(result.current.agents.size).toBe(10);
  });

  it("should handle multiple spaces with agents", () => {
    const { result } = renderHook(() => useSpaceStore());

    // Create two spaces
    const space1 = createMockSpace("space-1", "Space One", 100, 100);
    const space2 = createMockSpace("space-2", "Space Two", 100, 100);

    act(() => {
      result.current.addSpace(space1);
      result.current.addSpace(space2);
    });

    expect(result.current.spaces).toHaveLength(2);

    // Add agents to first space
    act(() => {
      result.current.setCurrentSpace("space-1");
      const agent1 = createMockAgent("agent-1", "Agent One", "space-1");
      const agent2 = createMockAgent("agent-2", "Agent Two", "space-1");
      result.current.addAgent("space-1", agent1);
      result.current.addAgent("space-1", agent2);
    });

    // Add agents to second space
    act(() => {
      result.current.setCurrentSpace("space-2");
      const agent3 = createMockAgent("agent-3", "Agent Three", "space-2");
      result.current.addAgent("space-2", agent3);
    });

    expect(result.current.agents.size).toBe(3);
  });

  it("should properly update user position across workflow", () => {
    const { result } = renderHook(() => useSpaceStore());

    const mockSpace = createMockSpace("position-space", "Position Test", 100, 100);

    act(() => {
      result.current.addSpace(mockSpace);
      result.current.setCurrentSpace("position-space");
    });

    // Initial position
    expect(result.current.userPosition).toEqual({ x: 25, y: 25 });

    // Move to various positions
    const positions = [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
      { x: 90, y: 90 },
    ];

    positions.forEach((pos) => {
      act(() => {
        result.current.setUserPosition(pos);
      });
      expect(result.current.userPosition).toEqual(pos);
    });
  });
});
