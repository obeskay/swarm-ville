# Contributing

## Code Style

- **Clean code**: No verbose comments, self-documenting code
- **Minimal docs**: Code > comments
- **OpenSpec first**: Use `openspec/` for planning
- **Token efficient**: Optimize AI prompts

## Workflow

1. Create OpenSpec proposal: `openspec/changes/[change-id]/`
2. Validate: `openspec validate [change-id] --strict`
3. Implement per `tasks.md`
4. Update tasks: Mark `[x]` when complete
5. Archive: `openspec archive [change-id]`

## Architecture

- **Frontend**: React + PixiJS (game rendering)
- **Backend**: Rust/Tauri (desktop app + SQLite)
- **AI**: Google Gemini (sprites + maps)
- **Sync**: WebSocket (planned)

## Pull Requests

- Link to OpenSpec change
- Update relevant specs
- Clean, minimal code
- No verbose comments

## Testing

```bash
npm run tauri dev    # Development
npm run tauri build  # Production build
```
