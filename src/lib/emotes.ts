/** The five reactions. The relay only ever passes these ids along. */
export const EMOTES = [
  { id: "wave", glyph: "👋" },
  { id: "clap", glyph: "👏" },
  { id: "heart", glyph: "❤️" },
  { id: "fire", glyph: "🔥" },
  { id: "party", glyph: "🎉" }
] as const;

export const glyphOf = (id: string) => EMOTES.find((emote) => emote.id === id)?.glyph ?? "";
