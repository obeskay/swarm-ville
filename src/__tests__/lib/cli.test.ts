import { describe, it, expect, vi } from 'vitest'
import { mapCLITypeToModel } from '../../lib/cli'

describe('CLI Module', () => {
  describe('mapCLITypeToModel', () => {
    it('should map claude CLI to claude model', () => {
      const model = mapCLITypeToModel('claude')
      expect(model).toBe('claude-3-sonnet')
    })

    it('should map gemini CLI to gemini model', () => {
      const model = mapCLITypeToModel('gemini')
      expect(model).toBe('gemini-pro')
    })

    it('should map openai CLI to gpt-4', () => {
      const model = mapCLITypeToModel('openai')
      expect(model).toBe('gpt-4')
    })

    it('should return default for unknown CLI', () => {
      const model = mapCLITypeToModel('unknown')
      expect(model).toBe('unknown')
    })

    it('should be case-insensitive', () => {
      const modelUpper = mapCLITypeToModel('CLAUDE')
      const modelLower = mapCLITypeToModel('claude')
      expect(modelUpper).toBe(modelLower)
    })

    it('should handle all supported CLI types', () => {
      const supportedCLIs = ['claude', 'gemini', 'openai']
      supportedCLIs.forEach((cli) => {
        const model = mapCLITypeToModel(cli)
        expect(model).toBeTruthy()
        expect(typeof model).toBe('string')
      })
    })
  })

  describe('CLI Detection', () => {
    it('should handle CLI type validation', () => {
      const validCLIs = ['claude', 'gemini', 'openai']
      const isValid = (cli: string) => validCLIs.includes(cli.toLowerCase())

      expect(isValid('claude')).toBe(true)
      expect(isValid('GEMINI')).toBe(false) // Case sensitive check
      expect(isValid('unknown')).toBe(false)
    })
  })

  describe('Model Configuration', () => {
    it('should have consistent model names', () => {
      const models = {
        claude: 'claude-3-sonnet',
        gemini: 'gemini-pro',
        openai: 'gpt-4',
      }

      Object.entries(models).forEach(([cli, expectedModel]) => {
        const model = mapCLITypeToModel(cli)
        expect(model).toBe(expectedModel)
      })
    })
  })
})
