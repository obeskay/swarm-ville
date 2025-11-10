# Tauri v2 Migration Guide for SwarmVille

## Migration Commands

```bash
npm install @tauri-apps/cli@latest
npm run tauri migrate
```

## Key Changes from v1 to v2

### 1. Configuration Format
- File structure stays similar but some fields renamed
- `devPath` instead of `devUrl` in some contexts
- `distDir` instead of `frontendDist`

### 2. State Management (CRITICAL)
**Best Practice**: Use `Arc<Mutex<T>>` for shared mutable state

```rust
use std::sync::{Arc, Mutex};

struct AppState {
    db: Arc<PersistenceLayer>,
}

// In setup:
app.manage(AppState {
    db: Arc::new(persistence_layer),
});

// In commands:
#[tauri::command]
async fn my_command(state: State<'_, AppState>) -> Result<()> {
    // Access state
    Ok(())
}
```

### 3. Command Registration
Same pattern:
```rust
tauri::Builder::default()
    .manage(AppState { /* ... */ })
    .invoke_handler(tauri::generate_handler![
        command1,
        command2,
    ])
    .run(tauri::generate_context!())
```

### 4. Removed APIs
- `@tauri-apps/api/process` → `@tauri-apps/plugin-process`
- `@tauri-apps/api/shell` → `@tauri-apps/plugin-shell`
- `@tauri-apps/api/fs` → `@tauri-apps/plugin-fs`

### 5. Setup Hook Pattern
```rust
.setup(|app| {
    // Initialize state
    app.manage(MyState::default());
    
    // Spawn background tasks
    tokio::spawn(async move {
        // background work
    });
    
    Ok(())
})
```

## Our Current Implementation Status

### ✅ Already Following Best Practices
- Using `Arc<Mutex<Connection>>` in PersistenceLayer
- Commands use `State<'_, T>` pattern
- Setup hook for initialization

### 🔄 Needs Update
- Tauri v1.x dependencies → v2.x
- tauri.conf.json format (minor)
- Add `@tauri-apps/plugin-*` where needed

## Migration Steps for SwarmVille

1. Update Cargo.toml: `tauri = "2.0"`
2. Update package.json: `@tauri-apps/cli@latest`
3. Run `npm run tauri migrate`
4. Test all commands
5. Update any removed APIs

## Performance Tips
- Use async commands for I/O operations
- Keep state minimal and use Arc for shared data
- Batch database operations where possible
