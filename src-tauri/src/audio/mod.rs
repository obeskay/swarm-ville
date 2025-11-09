pub mod capture;

use crate::error::{Result, SwarmvilleError};
use std::sync::{Arc, Mutex};

lazy_static::lazy_static! {
    static ref AUDIO_CAPTURE: Arc<Mutex<Option<capture::AudioCapture>>> = Arc::new(Mutex::new(None));
}

pub async fn start_recording() -> Result<()> {
    let mut capture = AUDIO_CAPTURE.lock().unwrap();

    if capture.is_none() {
        *capture = Some(capture::AudioCapture::new()?);
    }

    if let Some(ref mut audio) = capture.as_mut() {
        audio.start_recording()?;
        tracing::info!("Audio recording started");
    }

    Ok(())
}

pub async fn stop_recording() -> Result<Vec<f32>> {
    let mut capture = AUDIO_CAPTURE.lock().unwrap();

    if let Some(ref mut audio) = capture.as_mut() {
        let samples = audio.stop_recording()?;
        tracing::info!("Audio recording stopped, captured {} samples", samples.len());
        return Ok(samples);
    }

    Err(SwarmvilleError::Audio("No recording in progress".to_string()))
}

pub fn is_recording() -> bool {
    let capture = AUDIO_CAPTURE.lock().unwrap();
    capture.as_ref().map(|a| a.is_recording()).unwrap_or(false)
}

pub async fn transcribe_audio(audio: Vec<f32>, model: &str) -> Result<String> {
    if audio.is_empty() {
        return Err(SwarmvilleError::Audio("Empty audio buffer".to_string()));
    }

    tracing::info!("Transcribing {} audio samples with model: {}", audio.len(), model);

    // TODO: Implement Whisper transcription
    // For now, return placeholder
    Ok(format!("Transcribed audio with {} samples", audio.len()))
}
