/**
 * Template Manager
 * Manages sprite generation templates and applies them for consistent results
 */

import {
  SpriteDatabase,
  type SpriteTemplate,
} from "../db/SpriteDatabase";

export interface TemplateVariables {
  [key: string]: string;
}

export interface AppliedTemplate {
  templateId: string;
  templateName: string;
  filledPrompt: string;
  category: string;
  proportions: {
    headRatio: number;
    bodyRatio: number;
    legsRatio: number;
  };
  constraints: {
    minHeight: number;
    maxHeight: number;
    symmetrical: boolean;
  };
  colorPalette: string[];
}

export class TemplateManager {
  private templates: SpriteTemplate[] = [];
  private loaded: boolean = false;

  /**
   * Load all templates from database
   */
  async loadTemplates(): Promise<void> {
    this.templates = await SpriteDatabase.getAllTemplates();
    this.loaded = true;
  }

  /**
   * Get all loaded templates
   */
  getTemplates(): SpriteTemplate[] {
    if (!this.loaded) {
      console.warn(
        "Templates not loaded yet. Call loadTemplates() first.",
      );
    }
    return this.templates;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): SpriteTemplate[] {
    return this.templates.filter((t) => t.category === category);
  }

  /**
   * Get predefined templates only
   */
  getPredefinedTemplates(): SpriteTemplate[] {
    return this.templates.filter((t) => t.is_predefined === 1);
  }

  /**
   * Get a template by ID
   */
  getTemplateById(id: string): SpriteTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  /**
   * Apply a template with variables to generate a complete prompt
   */
  async applyTemplate(
    templateId: string,
    variables: TemplateVariables,
  ): Promise<AppliedTemplate> {
    const template = this.getTemplateById(templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Fill in template variables
    const filledPrompt = this.interpolatePrompt(
      template.base_prompt,
      variables,
    );

    // Increment usage count
    await SpriteDatabase.incrementTemplateUsage(templateId);

    return {
      templateId: template.id,
      templateName: template.name,
      filledPrompt,
      category: template.category,
      proportions: SpriteDatabase.parseTemplateProportions(template),
      constraints: SpriteDatabase.parseTemplateConstraints(template),
      colorPalette: SpriteDatabase.parseTemplateColors(template),
    };
  }

  /**
   * Interpolate variables in prompt template
   * Example: "A {adjective} knight with {weapon}" -> "A brave knight with sword"
   */
  private interpolatePrompt(
    template: string,
    variables: TemplateVariables,
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(regex, value);
    }

    // Check for unfilled placeholders
    const unfilled = result.match(/\{[^}]+\}/g);
    if (unfilled) {
      console.warn(
        `Unfilled template variables: ${unfilled.join(", ")}`,
      );
    }

    return result;
  }

  /**
   * Extract placeholders from a template prompt
   * Example: "A {adjective} knight" -> ["adjective"]
   */
  extractPlaceholders(templateId: string): string[] {
    const template = this.getTemplateById(templateId);
    if (!template) return [];

    const matches = template.base_prompt.match(/\{([^}]+)\}/g);
    if (!matches) return [];

    return matches.map((m) => m.slice(1, -1)); // Remove { and }
  }

  /**
   * Get example prompts for a template
   */
  getTemplateExamples(templateId: string): string[] {
    const template = this.getTemplateById(templateId);
    if (!template) return [];

    return SpriteDatabase.parseTemplateExamples(template);
  }

  /**
   * Build a complete sprite generation prompt from template
   * This adds the pixel art constraints and format requirements
   */
  buildCompletePrompt(appliedTemplate: AppliedTemplate): string {
    const { filledPrompt, proportions, constraints, colorPalette } =
      appliedTemplate;

    return `
SPRITE TEMPLATE STRUCTURE (192x192 pixel sprite sheet):

Grid Layout: 4 columns × 3 rows
- Column 1: Facing Down (frames 1-3)
- Column 2: Facing Left (frames 1-3)
- Column 3: Facing Right (frames 1-3)
- Column 4: Facing Up (frames 1-3)

Each frame size: 64x64 pixels
Frame sequence: idle, step1, step2

Character: ${filledPrompt}

Character Proportions:
- Head ratio: ${proportions.headRatio}
- Body ratio: ${proportions.bodyRatio}
- Legs ratio: ${proportions.legsRatio}
- Height: ${constraints.minHeight}-${constraints.maxHeight} pixels
- Symmetrical: ${constraints.symmetrical ? "yes" : "no"}

${colorPalette.length > 0 ? `Suggested Color Palette:\n${colorPalette.join(", ")}` : ""}

Style Requirements:
- Pure pixel art aesthetic (8-bit/16-bit style)
- Each pixel must be clearly defined
- Simple color palette (8-12 colors max)
- Black outline around character
- Transparent background (#00000000)
- No anti-aliasing or blur
- Consistent character proportions across all frames
- Clear walking animation (subtle movement between frames)
- Character should be ${constraints.minHeight}-${constraints.maxHeight} pixels tall in each frame
- Centered in each 64x64 frame cell

Output:
- Single 192x192 PNG image
- Organized as described grid
- All 12 frames showing: down, left, right, up directions
- Each direction has 3 frames for walk cycle
- Transparent background
- Pixel-perfect alignment`;
  }

  /**
   * Quick apply: Apply template with simple string values
   * Example: applyTemplateQuick("knight-001", "brave", "red cape", "sword")
   */
  async applyTemplateQuick(
    templateId: string,
    ...values: string[]
  ): Promise<AppliedTemplate> {
    const placeholders = this.extractPlaceholders(templateId);

    const variables: TemplateVariables = {};
    placeholders.forEach((key, index) => {
      variables[key] = values[index] || "";
    });

    return this.applyTemplate(templateId, variables);
  }

  /**
   * Get suggested templates based on description
   */
  suggestTemplates(description: string): SpriteTemplate[] {
    const lowerDesc = description.toLowerCase();

    // Keywords mapping to categories
    const categoryKeywords: Record<string, string[]> = {
      humanoid: ["person", "knight", "mage", "warrior", "human", "elf"],
      creature: ["slime", "monster", "beast", "animal", "dragon"],
      vehicle: ["car", "ship", "plane", "vehicle"],
      object: ["chest", "tree", "rock", "item"],
    };

    // Find matching category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lowerDesc.includes(kw))) {
        const categoryTemplates = this.getTemplatesByCategory(category);
        if (categoryTemplates.length > 0) {
          return categoryTemplates;
        }
      }
    }

    // Return predefined templates as fallback
    return this.getPredefinedTemplates();
  }

  /**
   * Auto-fill template from natural language description
   * Example: "brave knight with red cape and sword"
   * -> Detects template, extracts variables automatically
   */
  async autoApplyFromDescription(
    description: string,
  ): Promise<AppliedTemplate> {
    const suggestions = this.suggestTemplates(description);

    if (suggestions.length === 0) {
      throw new Error("No suitable template found for description");
    }

    // Use first suggested template
    const template = suggestions[0];
    const placeholders = this.extractPlaceholders(template.id);

    // Simple extraction: use description for all placeholders
    // (can be made more sophisticated with NLP)
    const variables: TemplateVariables = {};
    placeholders.forEach((key) => {
      variables[key] = description;
    });

    return this.applyTemplate(template.id, variables);
  }
}

// Singleton instance
export const templateManager = new TemplateManager();
