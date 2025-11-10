import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpaceStore } from "../../stores/spaceStore";
import type { Space, Agent } from "../../lib/types";

// Helper to create mock space
const createMockSpace = (id: string, name: string): Space => ({
  id,
  name,
  ownerId: "test-user",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  dimensions: { width: 50, height: 50 },
  tileset: { floor: "default", theme: "modern" },
  agents: [],
  settings: { proximityRadius: 5, maxAgents: 10, snapToGrid: true },
});

// Helper to create mock agent
const createMockAgent = (id: string, name: string, spaceId: string): Agent => ({
  id,
  name,
  spaceId,
  ownerId: "test-user",
  createdAt: Date.now(),
  position: { x: 10, y: 10 },
  role: "coder",
  model: { provider: "claude", modelName: "claude-3-sonnet", useUserCLI: false },
  avatar: { icon: "🤖", color: "#3B82F6" },
  state: "idle",
});

describe("Space Store (Zustand)", () => {
  beforeEach(() => {
    // Reset store state before each test
    useSpaceStore.setState({
      spaces: [],
      currentSpaceId: null,
      agents: new Map(),
      userPosition: { x: 25, y: 25 },
    });
  });

  describe("Space Management", () => {
    it("should create a new space", () => {
      const { result } = renderHook(() => useSpaceStore());

      const mockSpace = createMockSpace("space-1", "Test Space");

      act(() => {
        result.current.addSpace(mockSpace);
      });

      expect(result.current.spaces).toHaveLength(1);
      expect(result.current.spaces[0].name).toBe("Test Space");
    });

    it("should set current space", () => {
      const { result } = renderHook(() => useSpaceStore());

      const mockSpace = createMockSpace("space-1", "Test Space");

      act(() => {
        result.current.addSpace(mockSpace);
      });

      act(() => {
        result.current.setCurrentSpace("space-1");
      });

      expect(result.current.currentSpaceId).toBe("space-1");
    });
  });

  describe("Agent Management", () => {
    it("should add an agent to a space", () => {
      const { result } = renderHook(() => useSpaceStore());

      const mockSpace = createMockSpace("space-1", "Test Space");

      act(() => {
        result.current.addSpace(mockSpace);
        result.current.setCurrentSpace("space-1");
      });

      const mockAgent = createMockAgent("agent-1", "TestBot", "space-1");

      act(() => {
        result.current.addAgent("space-1", mockAgent);
      });

      const agent = result.current.agents.get("agent-1");
      expect(agent).toBeDefined();
      expect(agent?.name).toBe("TestBot");
    });

    it("should update agent position", () => {
      const { result } = renderHook(() => useSpaceStore());

      const mockSpace = createMockSpace("space-1", "Test Space");
      const mockAgent = createMockAgent("agent-1", "TestBot", "space-1");

      act(() => {
        result.current.addSpace(mockSpace);
        result.current.setCurrentSpace("space-1");
        result.current.addAgent("space-1", mockAgent);
      });

      act(() => {
        result.current.updateAgent("agent-1", { position: { x: 20, y: 20 } });
      });

      const agent = result.current.agents.get("agent-1");
      expect(agent?.position).toEqual({ x: 20, y: 20 });
    });

    it("should remove an agent", () => {
      const { result } = renderHook(() => useSpaceStore());

      const mockSpace = createMockSpace("space-1", "Test Space");
      const mockAgent = createMockAgent("agent-1", "TestBot", "space-1");

      act(() => {
        result.current.addSpace(mockSpace);
        result.current.setCurrentSpace("space-1");
        result.current.addAgent("space-1", mockAgent);
      });

      expect(result.current.agents.has("agent-1")).toBe(true);

      act(() => {
        result.current.removeAgent("agent-1");
      });

      expect(result.current.agents.has("agent-1")).toBe(false);
    });

    it("should update agent state", () => {
      const { result } = renderHook(() => useSpaceStore());

      const mockSpace = createMockSpace("space-1", "Test Space");
      const mockAgent = createMockAgent("agent-1", "TestBot", "space-1");

      act(() => {
        result.current.addSpace(mockSpace);
        result.current.setCurrentSpace("space-1");
        result.current.addAgent("space-1", mockAgent);
      });

      act(() => {
        result.current.updateAgent("agent-1", { state: "thinking" });
      });

      const agent = result.current.agents.get("agent-1");
      expect(agent?.state).toBe("thinking");
    });
  });

  describe("Multi-Agent Scenarios", () => {
    it("should manage multiple agents in a space", () => {
      const { result } = renderHook(() => useSpaceStore());

      const mockSpace = createMockSpace("space-1", "Test Space");

      act(() => {
        result.current.addSpace(mockSpace);
        result.current.setCurrentSpace("space-1");

        for (let i = 0; i < 5; i++) {
          const agent = createMockAgent(`agent-${i}`, `Bot ${i}`, "space-1");
          agent.position = { x: i * 10, y: i * 10 };
          result.current.addAgent("space-1", agent);
        }
      });

      expect(result.current.agents.size).toBe(5);
    });
  });
});
