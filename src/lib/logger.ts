/**
 * Minimal logger for SwarmVille
 * Reduces token consumption while debugging
 */

const isDev = import.meta.env.DEV;

export const log = {
  // Only log in dev mode, with minimal format
  init: (msg: string, data?: unknown) => {
    if (isDev) console.log(`🎮 ${msg}`, data ?? "");
  },

  error: (msg: string, err?: unknown) => {
    console.error(`❌ ${msg}`, err ?? "");
  },

  warn: (msg: string, data?: unknown) => {
    if (isDev) console.warn(`⚠️  ${msg}`, data ?? "");
  },

  // Use only for critical user-facing info
  info: (msg: string) => {
    console.log(`ℹ️  ${msg}`);
  },
};
