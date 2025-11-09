use thiserror::Error;

#[derive(Error, Debug)]
pub enum SwarmvilleError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("Audio error: {0}")]
    Audio(String),

    #[error("CLI error: {0}")]
    Cli(String),

    #[error("Agent error: {0}")]
    Agent(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Unknown error")]
    Unknown,
}

pub type Result<T> = std::result::Result<T, SwarmvilleError>;
