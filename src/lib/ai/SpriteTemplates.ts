/**
 * Sprite Template System
 * Interfaces para trabajar con templates de la base de datos
 */

import { invoke } from "@tauri-apps/api/core";

export interface SpriteTemplate {
  id: string;
  name: string;
  category: string;
  base_prompt: string;
  proportions: string; // JSON
  constraints: string; // JSON
  color_palette?: string; // JSON
  example_prompts?: string; // JSON
  is_predefined: number;
  usage_count: number;
  rating?: number;
  created_at: number;
  updated_at: number;
}

export interface TemplateProportions {
  headRatio: number;
  bodyRatio: number;
  legsRatio: number;
}

export interface TemplateConstraints {
  minHeight: number;
  maxHeight: number;
  symmetrical: boolean;
}

/**
 * Get all sprite templates from database
 */
export async function getAllTemplates(): Promise<SpriteTemplate[]> {
  try {
    if (!window.__TAURI_IPC__) {
      // Fallback for dev mode - return default templates
      return getDefaultTemplates();
    }

    const templatesJson = await invoke<string>("get_sprite_templates");
    return JSON.parse(templatesJson);
  } catch (error) {
    console.error("Failed to load templates:", error);
    return getDefaultTemplates();
  }
}

/**
 * Get specific template by ID
 */
export async function getTemplate(
  templateId: string,
): Promise<SpriteTemplate | null> {
  try {
    if (!window.__TAURI_IPC__) {
      return getDefaultTemplates().find((t) => t.id === templateId) || null;
    }

    const templateJson = await invoke<string>("get_sprite_template", {
      templateId,
    });
    const result = JSON.parse(templateJson);
    return result || null;
  } catch (error) {
    return null;
  }
}

/**
 * Apply template to user description
 */
export function applyTemplate(
  template: SpriteTemplate,
  userDescription: string,
): string {
  // Parse template variables from base_prompt
  const basePrompt = template.base_prompt;

  // Simple replacement for now - can be enhanced with proper template engine
  let finalPrompt = basePrompt;

  // Extract key-value pairs from user description
  const parts = userDescription.split(/,\s*/);
  const values: Record<string, string> = {};

  parts.forEach((part) => {
    const words = part.trim().split(/\s+/);
    if (words.length === 1) {
      values.adjective = words[0];
    } else if (words.length > 1) {
      values[words[words.length - 1].toLowerCase()] = words
        .slice(0, -1)
        .join(" ");
    }
  });

  // Replace template variables
  finalPrompt = finalPrompt.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] || match;
  });

  // Add remaining description
  if (userDescription) {
    finalPrompt += ` Additional details: ${userDescription}`;
  }

  return finalPrompt;
}

/**
 * Get constraints from template
 */
export function getTemplateConstraints(
  template: SpriteTemplate,
): TemplateConstraints {
  try {
    return JSON.parse(template.constraints);
  } catch {
    return {
      minHeight: 48,
      maxHeight: 56,
      symmetrical: true,
    };
  }
}

/**
 * Get proportions from template
 */
export function getTemplateProportions(
  template: SpriteTemplate,
): TemplateProportions {
  try {
    return JSON.parse(template.proportions);
  } catch {
    return {
      headRatio: 1,
      bodyRatio: 1.5,
      legsRatio: 1.5,
    };
  }
}

/**
 * Get color palette from template
 */
export function getTemplateColors(template: SpriteTemplate): string[] {
  try {
    return template.color_palette ? JSON.parse(template.color_palette) : [];
  } catch {
    return [];
  }
}

/**
 * Default templates (fallback for dev mode)
 */
function getDefaultTemplates(): SpriteTemplate[] {
  return [
    {
      id: "humanoid-knight-001",
      name: "Humanoid Knight",
      category: "humanoid",
      base_prompt:
        "A {adjective} knight character. Armor type: {armorType}. Weapon: {weapon}. Color scheme: {colorScheme}.",
      proportions: JSON.stringify({
        headRatio: 1,
        bodyRatio: 1.5,
        legsRatio: 1.5,
      }),
      constraints: JSON.stringify({
        minHeight: 48,
        maxHeight: 56,
        symmetrical: true,
      }),
      color_palette: JSON.stringify([
        "#c0c0c0",
        "#ff0000",
        "#ffd700",
        "#000000",
      ]),
      example_prompts: JSON.stringify([
        "brave, plate armor, longsword, silver and blue",
        "dark, leather armor, dual daggers, black and red",
      ]),
      is_predefined: 1,
      usage_count: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    {
      id: "humanoid-mage-001",
      name: "Humanoid Mage",
      category: "humanoid",
      base_prompt:
        "A {adjective} mage character. Robe style: {robeStyle}. Staff type: {staff}. Magic element: {element}.",
      proportions: JSON.stringify({
        headRatio: 1,
        bodyRatio: 1.8,
        legsRatio: 1.2,
      }),
      constraints: JSON.stringify({
        minHeight: 48,
        maxHeight: 56,
        symmetrical: true,
      }),
      color_palette: JSON.stringify([
        "#4040ff",
        "#ff40ff",
        "#ffffff",
        "#000000",
      ]),
      example_prompts: JSON.stringify([
        "wise, flowing robes, crystal staff, ice magic",
        "evil, dark robes, bone staff, shadow magic",
      ]),
      is_predefined: 1,
      usage_count: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    {
      id: "creature-slime-001",
      name: "Slime Creature",
      category: "creature",
      base_prompt:
        "A {size} slime creature. Color: {color}. Expression: {expression}.",
      proportions: JSON.stringify({ headRatio: 0, bodyRatio: 1, legsRatio: 0 }),
      constraints: JSON.stringify({
        minHeight: 32,
        maxHeight: 48,
        symmetrical: true,
      }),
      color_palette: JSON.stringify([
        "#00ff00",
        "#00aa00",
        "#004400",
        "#ffffff",
      ]),
      example_prompts: JSON.stringify(["medium, green, happy", "large, blue, angry"]),
      is_predefined: 1,
      usage_count: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  ];
}
