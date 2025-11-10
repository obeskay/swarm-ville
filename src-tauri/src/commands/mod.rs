pub mod achievements;

// State for persistence commands
pub struct AppState {
    pub db: std::sync::Arc<crate::db::PersistenceLayer>,
}
