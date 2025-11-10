/**
 * TypeScript wrapper for Sprite Database operations
 * Provides type-safe access to Tauri backend database commands
 */

import { invoke } from "@tauri-apps/api/core";

export interface SpriteTemplate {
  id: string;
  name: string;
  category: string;
  base_prompt: string;
  proportions: string;
  constraints: string;
  color_palette: string | null;
  example_prompts: string | null;
  is_predefined: number;
  usage_count: number;
  rating: number | null;
  created_at: number;
  updated_at: number;
}

export interface GeneratedSprite {
  id: string;
  character_name: string;
  description: string;
  template_id: string | null;
  style: string;
  dimensions: string;
  file_path: string;
  thumbnail_path: string | null;
  prompt: string;
  model_used: string;
  generation_params: string | null;
  validation_result: string | null;
  had_warnings: number;
  had_errors: number;
  generation_time_ms: number | null;
  file_size_bytes: number | null;
  retries: number;
  tags: string | null;
  is_favorite: number;
  usage_count: number;
  rating: number | null;
  created_at: number;
  updated_at: number;
}

export class SpriteDatabase {
  /**
   * Get all sprite templates from database
   */
  static async getAllTemplates(): Promise<SpriteTemplate[]> {
    const result = await invoke<string>("get_sprite_templates");
    return JSON.parse(result);
  }

  /**
   * Get a specific template by ID
   */
  static async getTemplateById(
    templateId: string,
  ): Promise<SpriteTemplate | null> {
    const result = await invoke<string>("get_sprite_template", {
      templateId,
    });
    const parsed = JSON.parse(result);
    return parsed || null;
  }

  /**
   * Save a generated sprite to the database
   */
  static async saveGeneratedSprite(
    sprite: GeneratedSprite,
  ): Promise<string> {
    const spriteJson = JSON.stringify(sprite);
    return await invoke<string>("save_generated_sprite", {
      spriteJson,
    });
  }

  /**
   * Get all sprites generated from a specific template
   */
  static async getSpritesByTemplate(
    templateId: string,
  ): Promise<GeneratedSprite[]> {
    const result = await invoke<string>("get_sprites_by_template", {
      templateId,
    });
    return JSON.parse(result);
  }

  /**
   * Increment the usage count for a template
   */
  static async incrementTemplateUsage(templateId: string): Promise<string> {
    return await invoke<string>("increment_template_usage", {
      templateId,
    });
  }

  /**
   * Create a new GeneratedSprite object with defaults
   */
  static createGeneratedSprite(
    params: Partial<GeneratedSprite> & {
      character_name: string;
      description: string;
      prompt: string;
      file_path: string;
    },
  ): GeneratedSprite {
    const now = Math.floor(Date.now() / 1000);

    return {
      id: params.id || crypto.randomUUID(),
      character_name: params.character_name,
      description: params.description,
      template_id: params.template_id || null,
      style: params.style || "pixel-art",
      dimensions: params.dimensions || JSON.stringify({ width: 192, height: 192 }),
      file_path: params.file_path,
      thumbnail_path: params.thumbnail_path || null,
      prompt: params.prompt,
      model_used: params.model_used || "imagen-3.0-generate-002",
      generation_params: params.generation_params || null,
      validation_result: params.validation_result || null,
      had_warnings: params.had_warnings || 0,
      had_errors: params.had_errors || 0,
      generation_time_ms: params.generation_time_ms || null,
      file_size_bytes: params.file_size_bytes || null,
      retries: params.retries || 0,
      tags: params.tags || null,
      is_favorite: params.is_favorite || 0,
      usage_count: params.usage_count || 0,
      rating: params.rating || null,
      created_at: params.created_at || now,
      updated_at: params.updated_at || now,
    };
  }

  /**
   * Parse JSON fields from template
   */
  static parseTemplateProportions(template: SpriteTemplate): {
    headRatio: number;
    bodyRatio: number;
    legsRatio: number;
  } {
    try {
      return JSON.parse(template.proportions);
    } catch {
      return { headRatio: 1, bodyRatio: 1.5, legsRatio: 1.5 };
    }
  }

  /**
   * Parse JSON fields from template
   */
  static parseTemplateConstraints(template: SpriteTemplate): {
    minHeight: number;
    maxHeight: number;
    symmetrical: boolean;
  } {
    try {
      return JSON.parse(template.constraints);
    } catch {
      return { minHeight: 48, maxHeight: 56, symmetrical: true };
    }
  }

  /**
   * Parse color palette from template
   */
  static parseTemplateColors(template: SpriteTemplate): string[] {
    if (!template.color_palette) return [];
    try {
      return JSON.parse(template.color_palette);
    } catch {
      return [];
    }
  }

  /**
   * Parse example prompts from template
   */
  static parseTemplateExamples(template: SpriteTemplate): string[] {
    if (!template.example_prompts) return [];
    try {
      return JSON.parse(template.example_prompts);
    } catch {
      return [];
    }
  }

  /**
   * Parse sprite tags
   */
  static parseSpriteTags(sprite: GeneratedSprite): string[] {
    if (!sprite.tags) return [];
    try {
      return JSON.parse(sprite.tags);
    } catch {
      return [];
    }
  }

  /**
   * Parse sprite dimensions
   */
  static parseSpriteDimensions(sprite: GeneratedSprite): {
    width: number;
    height: number;
  } {
    try {
      return JSON.parse(sprite.dimensions);
    } catch {
      return { width: 192, height: 192 };
    }
  }
}
