# SwarmVille

A virtual 2D environment where AI agents collaborate on coding tasks. Watch multiple AI agents work together in a visual, game-like interface.

![SwarmVille Screenshot](docs/screenshot.png)

## Features

- **Visual Agent Workspace**: See AI agents as pixel-art characters moving around a 2D map
- **Multi-Agent Collaboration**: Deploy teams of specialized agents (Researcher, Designer, Developer, Reviewer)
- **Real AI Integration**: Connect to Claude, Cursor, OpenCode, and other AI coding assistants
- **Character Selection**: Choose from 83 different pixel-art character sprites
- **Real-time Updates**: Watch agents work, see their messages, and track progress

## Quick Start

```bash
# Install dependencies
pnpm install

# Start the WebSocket server (in one terminal)
pnpm run ws

# Start the app (in another terminal)
pnpm run dev
```

Or run both together:

```bash
pnpm run dev:all
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Game Engine**: PixiJS v8 (2D rendering)
- **Desktop**: Tauri v2 (Rust-based)
- **Backend**: Node.js WebSocket server
- **AI Providers**: Claude Code, Cursor, OpenCode, Gemini CLI

## Controls

| Key        | Action               |
| ---------- | -------------------- |
| W/A/S/D    | Move player          |
| Arrow Keys | Alternative movement |
| ?          | Toggle help          |
| Esc        | Close dialogs        |

## Architecture

```
swarm-ville/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── game/              # PixiJS game engine
│   └── hooks/             # React hooks (WebSocket, agents)
├── server/                # Node.js WebSocket server
│   └── providers/         # AI provider integrations
├── src-tauri/             # Tauri (Rust) backend
│   └── src/
│       ├── agents/        # Agent runtime
│       └── ws/            # WebSocket server (Rust)
└── public/
    └── sprites/           # Character & tileset sprites
```

## AI Provider Support

SwarmVille can connect to various AI coding assistants:

| Provider    | Status   | Notes              |
| ----------- | -------- | ------------------ |
| Claude Code | ✅ Ready | Via `claude` CLI   |
| Cursor      | ✅ Ready | Via Cursor IDE     |
| OpenCode    | ✅ Ready | Via `opencode` CLI |
| Gemini CLI  | 🚧 Beta  | Via `gemini` CLI   |

## Development

```bash
# Type check
pnpm run type-check

# Lint
pnpm run lint

# Format
pnpm run format

# Run tests
pnpm run test
```

## Building

```bash
# Build for production
pnpm run build
```

This creates native binaries for macOS, Windows, and Linux via Tauri.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Pixel art sprites from [OpenGameArt](https://opengameart.org/)
- Built with [Tauri](https://tauri.app/), [PixiJS](https://pixijs.com/), and [React](https://react.dev/)
