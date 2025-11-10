// CLI Integration Module
// Connects to user's installed AI CLIs (Claude, Gemini, OpenAI)

pub mod connector;
pub mod detector;
pub mod types;

pub use connector::CLIConnector;
pub use detector::detect_installed_clis;
pub use types::{CLICommand, CLIError, CLIResponse, CLIType, CommandOptions};
