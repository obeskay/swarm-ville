import { z } from "zod";

// Agent Roles
export const agentRoleSchema = z.enum([
  "researcher",
  "coder",
  "designer",
  "pm",
  "qa",
  "devops",
  "custom",
]);

// Agent Spawner Form Schema
export const agentSpawnerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  role: agentRoleSchema,
  selectedCLI: z.string().min(1, "Model provider is required"),
});

export type AgentSpawnerFormData = z.infer<typeof agentSpawnerSchema>;

// Sprite Generator Form Schema
export const spriteGeneratorSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .min(3, "Description must be at least 3 characters")
    .max(200, "Description must be less than 200 characters"),
});

export type SpriteGeneratorFormData = z.infer<typeof spriteGeneratorSchema>;

// Chat Message Form Schema
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long"),
});

export type ChatMessageFormData = z.infer<typeof chatMessageSchema>;
