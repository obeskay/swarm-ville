import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpaceStore } from '../../stores/spaceStore'
import type { Space, Agent } from '../../lib/types'

describe('Space Store (Zustand)', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useSpaceStore.getState()
    useSpaceStore.setState({
      spaces: [],
      currentSpaceId: null,
      agents: new Map(),
      userPosition: { x: 25, y: 25 },
    })
  })

  describe('Space Management', () => {
    it('should create a new space', () => {
      const { result } = renderHook(() => useSpaceStore())

      act(() => {
        result.current.addSpace({
          id: 'space-1',
          name: 'Test Space',
          width: 50,
          height: 50,
          createdAt: new Date(),
        })
      })

      expect(result.current.spaces).toHaveLength(1)
      expect(result.current.spaces[0].name).toBe('Test Space')
    })

    it('should delete a space', () => {
      const { result } = renderHook(() => useSpaceStore())

      act(() => {
        result.current.addSpace({
          id: 'space-1',
          name: 'Test Space',
          width: 50,
          height: 50,
          createdAt: new Date(),
        })
      })

      expect(result.current.spaces).toHaveLength(1)

      act(() => {
        result.current.deleteSpace('space-1')
      })

      expect(result.current.spaces).toHaveLength(0)
    })

    it('should set current space', () => {
      const { result } = renderHook(() => useSpaceStore())

      act(() => {
        result.current.addSpace({
          id: 'space-1',
          name: 'Test Space',
          width: 50,
          height: 50,
          createdAt: new Date(),
        })
      })

      act(() => {
        result.current.setCurrentSpace('space-1')
      })

      expect(result.current.currentSpaceId).toBe('space-1')
    })
  })

  describe('Agent Management', () => {
    it('should add an agent to a space', () => {
      const { result } = renderHook(() => useSpaceStore())

      act(() => {
        result.current.addSpace({
          id: 'space-1',
          name: 'Test Space',
          width: 50,
          height: 50,
          createdAt: new Date(),
        })
        result.current.setCurrentSpace('space-1')
      })

      act(() => {
        result.current.addAgent({
          id: 'agent-1',
          name: 'TestBot',
          role: 'assistant',
          position: { x: 10, y: 10 },
          model: { provider: 'claude', name: 'claude-3-sonnet' },
          state: 'idle',
          messages: [],
          createdAt: new Date(),
        })
      })

      const agents = result.current.agents.get('space-1')
      expect(agents).toHaveLength(1)
      expect(agents?.[0].name).toBe('TestBot')
    })

    it('should update agent position', () => {
      const { result } = renderHook(() => useSpaceStore())

      act(() => {
        result.current.addSpace({
          id: 'space-1',
          name: 'Test Space',
          width: 50,
          height: 50,
          createdAt: new Date(),
        })
        result.current.setCurrentSpace('space-1')
        result.current.addAgent({
          id: 'agent-1',
          name: 'TestBot',
          role: 'assistant',
          position: { x: 10, y: 10 },
          model: { provider: 'claude', name: 'claude-3-sonnet' },
          state: 'idle',
          messages: [],
          createdAt: new Date(),
        })
      })

      act(() => {
        result.current.updateAgentPosition('agent-1', { x: 20, y: 20 })
      })

      const agents = result.current.agents.get('space-1')
      expect(agents?.[0].position).toEqual({ x: 20, y: 20 })
    })

    it('should remove an agent', () => {
      const { result } = renderHook(() => useSpaceStore())

      act(() => {
        result.current.addSpace({
          id: 'space-1',
          name: 'Test Space',
          width: 50,
          height: 50,
          createdAt: new Date(),
        })
        result.current.setCurrentSpace('space-1')
        result.current.addAgent({
          id: 'agent-1',
          name: 'TestBot',
          role: 'assistant',
          position: { x: 10, y: 10 },
          model: { provider: 'claude', name: 'claude-3-sonnet' },
          state: 'idle',
          messages: [],
          createdAt: new Date(),
        })
      })

      expect(result.current.agents.get('space-1')).toHaveLength(1)

      act(() => {
        result.current.removeAgent('agent-1')
      })

      expect(result.current.agents.get('space-1')).toHaveLength(0)
    })

    it('should update agent state', () => {
      const { result } = renderHook(() => useSpaceStore())

      act(() => {
        result.current.addSpace({
          id: 'space-1',
          name: 'Test Space',
          width: 50,
          height: 50,
          createdAt: new Date(),
        })
        result.current.setCurrentSpace('space-1')
        result.current.addAgent({
          id: 'agent-1',
          name: 'TestBot',
          role: 'assistant',
          position: { x: 10, y: 10 },
          model: { provider: 'claude', name: 'claude-3-sonnet' },
          state: 'idle',
          messages: [],
          createdAt: new Date(),
        })
      })

      act(() => {
        result.current.updateAgentState('agent-1', 'thinking')
      })

      const agents = result.current.agents.get('space-1')
      expect(agents?.[0].state).toBe('thinking')
    })
  })

  describe('User Position', () => {
    it('should update user position', () => {
      const { result } = renderHook(() => useSpaceStore())

      act(() => {
        result.current.setUserPosition({ x: 30, y: 40 })
      })

      expect(result.current.userPosition).toEqual({ x: 30, y: 40 })
    })

    it('should have default user position', () => {
      const { result } = renderHook(() => useSpaceStore())

      expect(result.current.userPosition).toEqual({ x: 25, y: 25 })
    })
  })

  describe('Multiple Agents', () => {
    it('should handle multiple agents in same space', () => {
      const { result } = renderHook(() => useSpaceStore())

      act(() => {
        result.current.addSpace({
          id: 'space-1',
          name: 'Test Space',
          width: 50,
          height: 50,
          createdAt: new Date(),
        })
        result.current.setCurrentSpace('space-1')

        for (let i = 0; i < 5; i++) {
          result.current.addAgent({
            id: `agent-${i}`,
            name: `Bot ${i}`,
            role: 'assistant',
            position: { x: i * 10, y: i * 10 },
            model: { provider: 'claude', name: 'claude-3-sonnet' },
            state: 'idle',
            messages: [],
            createdAt: new Date(),
          })
        }
      })

      const agents = result.current.agents.get('space-1')
      expect(agents).toHaveLength(5)
    })
  })
})
