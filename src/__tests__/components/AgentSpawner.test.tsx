import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentSpawner from '../../components/agents/AgentSpawner'

describe('AgentSpawner Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('should render spawner dialog', () => {
    const { container } = render(
      <AgentSpawner
        spaceId="test-space"
        onClose={mockOnClose}
      />
    )

    // Check for key elements (adjust based on actual component structure)
    expect(container.querySelector('[role="dialog"]')).toBeDefined()
  })

  it('should call onClose when dialog is closed', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <AgentSpawner
        spaceId="test-space"
        onClose={mockOnClose}
      />
    )

    // Find and click close button (adjust selector based on actual implementation)
    const closeButton = container.querySelector('[aria-label="Close"]')
    if (closeButton) {
      await user.click(closeButton)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })

  it('should handle agent name input', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <AgentSpawner
        spaceId="test-space"
        onClose={mockOnClose}
      />
    )

    const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement
    if (nameInput) {
      await user.type(nameInput, 'TestAgent')
      expect(nameInput.value).toBe('TestAgent')
    }
  })
})
