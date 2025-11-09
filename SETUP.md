# SwarmVille - Development Setup Guide

## Prerequisites

### System Requirements
- **Node.js**: 18 or higher
- **Rust**: 1.75 or higher
- **Tauri CLI**: Latest version
- **Git**: For version control

### Required AI CLIs
At least one of the following must be installed:
- **Claude CLI**: `npm install -g @anthropic-ai/sdk`
- **Gemini CLI**: Follow [Google Gemini setup](https://ai.google.dev/gemini-api/docs/)
- **OpenAI CLI**: `npm install -g openai`

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/swarm-ville.git
cd swarm-ville
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Rust Dependencies
The Tauri build process will automatically handle Rust dependencies defined in `src-tauri/Cargo.toml`.

Ensure you have a Rust toolchain installed:
```bash
# If not installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Update if already installed
rustup update
```

### 3. Verify CLI Installations

Test that your AI CLIs are properly configured:

```bash
# Test Claude CLI
claude --version

# Test Gemini CLI
gemini --version

# Test OpenAI CLI
openai --version
```

If these commands fail, check the respective CLI installation instructions.

## Development

### Start Development Server

```bash
npm run tauri dev
```

This will:
1. Start the Vite development server (http://localhost:5173)
2. Launch the Tauri application
3. Enable hot module reload (HMR)

### Project Structure

```
swarm-ville/
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── hooks/            # React hooks
│   ├── lib/              # Utilities
│   └── stores/           # State management
│
├── src-tauri/            # Rust backend
│   ├── src/
│   │   ├── audio/        # Audio capture & STT
│   │   ├── cli/          # CLI connectors
│   │   ├── db/           # Database
│   │   └── agents/       # Agent logic
│   └── Cargo.toml
│
└── openspec/             # Specifications
    └── specs/            # Active specs
```

## Building

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run tauri build
```

Output:
- **macOS**: `src-tauri/target/release/bundle/macos/SwarmVille.app`
- **Windows**: `src-tauri/target/release/bundle/msi/SwarmVille_*.msi`
- **Linux**: `src-tauri/target/release/bundle/deb/swarmville_*.deb`

## Testing

### Frontend Tests
```bash
npm run test
```

### Watch Mode
```bash
npm run test -- --watch
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Configuration

### STT Settings

Create or modify settings in the app:
1. Launch the app: `npm run tauri dev`
2. Complete onboarding wizard
3. Configure STT hotkey (default: Ctrl+Space)
4. Select Whisper model:
   - **Small** (fastest)
   - **Medium** (balanced)
   - **Large** (most accurate)

### CLI Configuration

The app auto-detects installed CLIs during first launch. To manually configure:
1. Open Settings in the app
2. Click "Manage CLIs"
3. Add or remove CLI connections
4. Test each connection

## Troubleshooting

### CLI Not Detected
- Verify CLI is installed: `which claude` / `which gemini` / `which openai`
- Restart the app
- Check CLI configuration: `<cli> --config`

### Audio Capture Issues
- Check microphone permissions in system settings
- Verify microphone is not in use by other applications
- Try different audio input device in settings

### Build Failures
```bash
# Clean build
rm -rf src-tauri/target
npm run tauri build

# Update Rust
rustup update
cargo update
```

### Tauri Issues
```bash
# Reinstall Tauri CLI
npm install -g @tauri-apps/cli

# Check Tauri requirements
cargo tauri info
```

## Environment Variables

Create `.env` file in project root:

```env
# Development
VITE_API_URL=http://localhost:5173
VITE_ENABLE_LOGGING=true

# Audio
AUDIO_BUFFER_SIZE=4096
WHISPER_MODEL_SIZE=small

# Feature Flags
ENABLE_STT=true
ENABLE_PROXIMITY=true
ENABLE_CLOUD_SYNC=false
```

## Performance

### Development Mode
- HMR enabled (fast updates)
- Source maps for debugging
- Slower on first start

### Production Mode
- Optimized bundle
- Minified code
- Tree-shaking enabled
- Code splitting

Target metrics:
- Bundle size: <15MB
- Startup time: <2s
- Memory usage: <500MB
- Frame rate: 60 FPS

## Contributing

See `CONTRIBUTING.md` for guidelines on:
- Branching strategy
- Commit conventions
- Code style
- Pull request process

## Deployment

### GitHub Actions CI/CD
Automated testing and building on every push.

### Desktop Distribution
- GitHub Releases: Auto-update enabled
- Homebrew: `brew install swarmville`
- Windows Store: Coming soon
- Snapcraft: Coming soon

See `DEPLOYMENT.md` for detailed deployment instructions.

## Useful Commands

```bash
# Development
npm run tauri dev          # Start dev server
npm run tauri dev -- --debug  # Debug mode

# Building
npm run build              # Build frontend
npm run tauri build        # Full production build
npm run tauri build -- --config-path # Custom config

# Testing & Quality
npm run test               # Run tests
npm run test:ui            # Vitest UI
npm run lint               # ESLint
npm run type-check         # TypeScript check

# Rust Backend
cd src-tauri
cargo build               # Build Rust
cargo test                # Test Rust
cargo fmt                 # Format code
cargo clippy              # Lint
```

## Resources

- **OpenSpec Specs**: `openspec/specs/`
- **API Docs**: `openspec/specs/01-technical-architecture.md`
- **User Flows**: `openspec/specs/02-user-flows.md`
- **Data Models**: `openspec/specs/03-data-models.md`
- **Tauri Docs**: https://tauri.app/
- **React Docs**: https://react.dev/
- **Rust Docs**: https://doc.rust-lang.org/

## Support

- Open an issue on GitHub
- Check existing issues for solutions
- Review troubleshooting section above
- Check OpenSpec documentation

---

Happy developing! 🚀
