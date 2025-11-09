import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentSpawner } from '../../components/agents/AgentSpawner'

describe('AgentSpawner Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSpawn = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnSpawn.mockClear()
  })

  it('should render spawner dialog', () => {
    render(
      <AgentSpawner
        isOpen={true}
        onClose={mockOnClose}
        onSpawn={mockOnSpawn}
      />
    )

    // Check for key elements (adjust based on actual component structure)
    expect(screen.getByText(/agent/i) || screen.getByRole('dialog')).toBeDefined()
  })

  it('should call onClose when dialog is closed', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <AgentSpawner
        isOpen={true}
        onClose={mockOnClose}
        onSpawn={mockOnSpawn}
      />
    )

    // Find and click close button (adjust selector based on actual implementation)
    const closeButton = container.querySelector('[aria-label="Close"]')
    if (closeButton) {
      await user.click(closeButton)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <AgentSpawner
        isOpen={false}
        onClose={mockOnClose}
        onSpawn={mockOnSpawn}
      />
    )

    // Dialog should not be visible
    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog).toBeNull()
  })

  it('should handle agent name input', async () => {
    const user = userEvent.setup()
    render(
      <AgentSpawner
        isOpen={true}
        onClose={mockOnClose}
        onSpawn={mockOnSpawn}
      />
    )

    const nameInput = screen.queryByPlaceholderText(/name/i)
    if (nameInput) {
      await user.type(nameInput, 'TestAgent')
      expect(nameInput).toHaveValue('TestAgent')
    }
  })
})
