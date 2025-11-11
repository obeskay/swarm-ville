pub mod achievements;

// State for persistence commands
pub struct AppState {
    #[allow(dead_code)]
    pub db: std::sync::Arc<crate::db::PersistenceLayer>,
}
