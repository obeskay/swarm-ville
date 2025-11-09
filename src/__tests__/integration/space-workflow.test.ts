import { describe, it, expect, beforeEach } from 'vitest'
import { useSpaceStore } from '../../stores/spaceStore'
import { renderHook, act } from '@testing-library/react'

describe('Space Workflow - Integration Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    useSpaceStore.setState({
      spaces: [],
      currentSpaceId: null,
      agents: new Map(),
      userPosition: { x: 25, y: 25 },
    })
  })

  it('should complete full workflow: create space -> add agents -> move -> interact', () => {
    const { result } = renderHook(() => useSpaceStore())

    // Step 1: Create a space
    act(() => {
      result.current.addSpace({
        id: 'workflow-space',
        name: 'Workflow Test Space',
        width: 100,
        height: 100,
        createdAt: new Date(),
      })
    })

    expect(result.current.spaces).toHaveLength(1)

    // Step 2: Set as current space
    act(() => {
      result.current.setCurrentSpace('workflow-space')
    })

    expect(result.current.currentSpaceId).toBe('workflow-space')

    // Step 3: Add multiple agents
    act(() => {
      for (let i = 0; i < 3; i++) {
        result.current.addAgent({
          id: `workflow-agent-${i}`,
          name: `Workflow Bot ${i}`,
          role: 'assistant',
          position: { x: 10 + i * 20, y: 10 },
          model: { provider: 'claude', name: 'claude-3-sonnet' },
          state: 'idle',
          messages: [],
          createdAt: new Date(),
        })
      }
    })

    const agents = result.current.agents.get('workflow-space')
    expect(agents).toHaveLength(3)

    // Step 4: Move user position
    act(() => {
      result.current.setUserPosition({ x: 50, y: 50 })
    })

    expect(result.current.userPosition).toEqual({ x: 50, y: 50 })

    // Step 5: Update agent positions
    act(() => {
      result.current.updateAgentPosition('workflow-agent-0', { x: 50, y: 50 })
    })

    const updatedAgent = result.current.agents
      .get('workflow-space')
      ?.find((a) => a.id === 'workflow-agent-0')
    expect(updatedAgent?.position).toEqual({ x: 50, y: 50 })

    // Step 6: Change agent state
    act(() => {
      result.current.updateAgentState('workflow-agent-0', 'thinking')
    })

    const thinkingAgent = result.current.agents
      .get('workflow-space')
      ?.find((a) => a.id === 'workflow-agent-0')
    expect(thinkingAgent?.state).toBe('thinking')

    // Step 7: Remove an agent
    act(() => {
      result.current.removeAgent('workflow-agent-0')
    })

    expect(result.current.agents.get('workflow-space')).toHaveLength(2)
  })

  it('should handle multiple spaces independently', () => {
    const { result } = renderHook(() => useSpaceStore())

    // Create two spaces
    act(() => {
      result.current.addSpace({
        id: 'space-1',
        name: 'Space 1',
        width: 50,
        height: 50,
        createdAt: new Date(),
      })
      result.current.addSpace({
        id: 'space-2',
        name: 'Space 2',
        width: 100,
        height: 100,
        createdAt: new Date(),
      })
    })

    expect(result.current.spaces).toHaveLength(2)

    // Add agents to space 1
    act(() => {
      result.current.setCurrentSpace('space-1')
      result.current.addAgent({
        id: 'agent-space1',
        name: 'Agent in Space 1',
        role: 'assistant',
        position: { x: 10, y: 10 },
        model: { provider: 'claude', name: 'claude-3-sonnet' },
        state: 'idle',
        messages: [],
        createdAt: new Date(),
      })
    })

    // Switch to space 2 and add agents
    act(() => {
      result.current.setCurrentSpace('space-2')
      result.current.addAgent({
        id: 'agent-space2',
        name: 'Agent in Space 2',
        role: 'assistant',
        position: { x: 20, y: 20 },
        model: { provider: 'gemini', name: 'gemini-pro' },
        state: 'idle',
        messages: [],
        createdAt: new Date(),
      })
    })

    // Verify agents are in correct spaces
    const agents1 = result.current.agents.get('space-1')
    const agents2 = result.current.agents.get('space-2')

    expect(agents1).toHaveLength(1)
    expect(agents2).toHaveLength(1)
    expect(agents1?.[0].name).toBe('Agent in Space 1')
    expect(agents2?.[0].name).toBe('Agent in Space 2')
  })

  it('should maintain data consistency across operations', () => {
    const { result } = renderHook(() => useSpaceStore())

    act(() => {
      result.current.addSpace({
        id: 'consistency-space',
        name: 'Consistency Test',
        width: 50,
        height: 50,
        createdAt: new Date(),
      })
      result.current.setCurrentSpace('consistency-space')
    })

    // Add agent and verify
    act(() => {
      result.current.addAgent({
        id: 'consistency-agent',
        name: 'Consistency Bot',
        role: 'assistant',
        position: { x: 25, y: 25 },
        model: { provider: 'claude', name: 'claude-3-sonnet' },
        state: 'idle',
        messages: [],
        createdAt: new Date(),
      })
    })

    let agent = result.current.agents
      .get('consistency-space')
      ?.find((a) => a.id === 'consistency-agent')
    expect(agent).toBeDefined()

    // Update multiple properties
    act(() => {
      result.current.updateAgentPosition('consistency-agent', { x: 40, y: 40 })
    })

    act(() => {
      result.current.updateAgentState('consistency-agent', 'thinking')
    })

    // Verify all updates were applied
    agent = result.current.agents
      .get('consistency-space')
      ?.find((a) => a.id === 'consistency-agent')
    expect(agent?.position).toEqual({ x: 40, y: 40 })
    expect(agent?.state).toBe('thinking')
    expect(agent?.name).toBe('Consistency Bot') // Should remain unchanged
  })
})
